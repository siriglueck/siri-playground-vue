<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\FirstAidUsed;
use App\Entity\IncidentReport;
use App\Entity\Injury;
use App\Entity\Participant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

// ---------------------------------------------------------------------------
// IncidentController
// ---------------------------------------------------------------------------
// A Symfony controller is just a class whose methods handle HTTP requests. The
// #[Route] attribute on the CLASS is a prefix, so every route below starts with
// /api/incidents. Extending AbstractController gives helpers like $this->json().
// ---------------------------------------------------------------------------
#[Route('/api/incidents')]
final class IncidentController extends AbstractController
{
    // -----------------------------------------------------------------------
    // GET /api/incidents  ->  list all incidents
    // -----------------------------------------------------------------------
    // `EntityManagerInterface $em` is auto-injected by Symfony (dependency
    // injection): you just type-hint it and the framework hands it to you.
    #[Route('', name: 'incident_list', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        // getRepository()->findAll() runs "SELECT * FROM incident_report".
        $reports = $em->getRepository(IncidentReport::class)->findAll();

        // Turn each entity into a plain array. `array_map` applies the callback
        // to every element (like JS's .map). `fn()` is a short arrow function.
        $data = array_map(fn (IncidentReport $r) => $this->serialize($r), $reports);

        // $this->json() encodes to JSON and sets the Content-Type header.
        return $this->json($data);
    }

    // -----------------------------------------------------------------------
    // GET /api/incidents/{id}  ->  one incident
    // -----------------------------------------------------------------------
    // {id} is a route parameter. `requirements` restricts it to digits so this
    // route doesn't clash with anything else. Symfony passes it as `int $id`.
    #[Route('/{id}', name: 'incident_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, EntityManagerInterface $em): JsonResponse
    {
        // find() looks up by primary key; returns null if not found.
        $report = $em->getRepository(IncidentReport::class)->find($id);

        if ($report === null) {
            // Return a 404 with a small JSON body.
            return $this->json(['error' => 'Incident not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serialize($report));
    }

    // -----------------------------------------------------------------------
    // POST /api/incidents  ->  create, fanning the JSON out into 4 tables
    // -----------------------------------------------------------------------
    // This is the important one: ONE JSON body from the Vue form becomes rows in
    // incident_report + participant + injury + first_aid_used.
    #[Route('', name: 'incident_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        // $request->getContent() is the raw request body (the JSON string).
        // json_decode(..., true) turns it into a PHP associative array.
        $data = json_decode($request->getContent(), true);

        // Defensive check: bail out with 400 if the body wasn't valid JSON.
        if (!is_array($data)) {
            return $this->json(['error' => 'Invalid JSON body'], Response::HTTP_BAD_REQUEST);
        }

        // --- 1) The top-level incident_report row --------------------------
        $report = new IncidentReport();
        $report
            ->setType($data['type'] ?? '')
            ->setLocation($data['location'] ?? '')
            ->setDescription($data['description'] ?? null)
            ->setStatus($data['status'] ?? 'draft');

        // The form already combined date+time into a DATETIME2 string like
        // "2026-07-22T14:30:00". `new \DateTimeImmutable()` parses it. `?? null`
        // guards a missing value (a draft might not have it yet).
        if (!empty($data['occurredAt'])) {
            $report->setOccurredAt(new \DateTimeImmutable($data['occurredAt']));
        }

        // --- 2) Loop the participants array --------------------------------
        // `?? []` = "use an empty array if the key is missing", so the foreach
        // is safe even when no participants were sent.
        foreach ($data['participants'] ?? [] as $p) {
            $participant = new Participant();
            $participant
                ->setName($p['name'] ?? '')
                ->setRole($p['role'] ?? null)
                ->setInjured($p['injured'] ?? false);

            // --- 3) Only injured people get an injury row ------------------
            if (!empty($p['injured'])) {
                $injury = new Injury();
                $injury->setDetails($p['injuryDetails'] ?? '');

                // --- 4) One first_aid_used row per array item --------------
                foreach ($p['firstAid'] ?? [] as $aid) {
                    $firstAid = new FirstAidUsed();
                    $firstAid->setAid($aid);
                    $injury->addFirstAidUsed($firstAid); // links injury_id
                }

                $participant->setInjury($injury); // links participant_id
            }

            $report->addParticipant($participant); // links incident_report_id
        }

        // --- Persist everything in one go ----------------------------------
        // We only persist the ROOT. Because every relationship above declared
        // cascade: ['persist'], Doctrine walks the object graph and INSERTs the
        // participants, injuries, and first-aid rows too. flush() runs the SQL.
        $em->persist($report);
        $em->flush();

        // 201 Created + the new id. `Location` header points at the new resource.
        return $this->json(
            ['id' => $report->getId(), 'status' => $report->getStatus()],
            Response::HTTP_CREATED,
            ['Location' => '/api/incidents/' . $report->getId()],
        );
    }

    // -----------------------------------------------------------------------
    // Helper: turn an IncidentReport (and its children) into a nested array.
    // -----------------------------------------------------------------------
    // Doing this by hand keeps the JSON shape explicit and avoids leaking the
    // whole entity graph. (In a real app you'd likely use the Serializer or an
    // output DTO instead.)
    private function serialize(IncidentReport $report): array
    {
        return [
            'id' => $report->getId(),
            'type' => $report->getType(),
            'location' => $report->getLocation(),
            // Format the DATETIME2 back to an ISO 8601 string for the frontend.
            'occurredAt' => $report->getOccurredAt()?->format('Y-m-d\TH:i:s'),
            'description' => $report->getDescription(),
            'status' => $report->getStatus(),
            'createdAt' => $report->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            // Map the participant collection to arrays. `->map()` is Doctrine's
            // Collection method; ->toArray() turns the result into a plain array.
            'participants' => $report->getParticipants()->map(function (Participant $p) {
                $injury = $p->getInjury();

                return [
                    'name' => $p->getName(),
                    'role' => $p->getRole(),
                    'injured' => $p->isInjured(),
                    'injuryDetails' => $injury?->getDetails(),
                    // If there's an injury, list its first-aid aid strings.
                    'firstAid' => $injury
                        ? $injury->getFirstAidsUsed()->map(fn (FirstAidUsed $f) => $f->getAid())->toArray()
                        : [],
                ];
            })->toArray(),
        ];
    }
}

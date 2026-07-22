<?php

// The <?php tag opens PHP. `declare(strict_types=1)` makes type checks strict
// (e.g. passing a string where an int is expected throws instead of coercing).
declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

// ---------------------------------------------------------------------------
// IncidentReport  ->  table `incident_report`
// ---------------------------------------------------------------------------
// In Symfony/Doctrine, a PHP class IS the table. The #[ORM\...] "attributes"
// (the #[...] lines) tell Doctrine how to map class -> table and property ->
// column. This is the top-level record; participants hang off it.
// ---------------------------------------------------------------------------
#[ORM\Entity]
#[ORM\Table(name: 'incident_report')]
class IncidentReport
{
    // Primary key. #[ORM\Id] marks it; GeneratedValue = auto-increment.
    // `?int` means "int or null" — it's null until the DB assigns one.
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // 'work' | 'otw' | 'almost'. length=20 sets the VARCHAR size.
    #[ORM\Column(length: 20)]
    private string $type = '';

    #[ORM\Column(length: 255)]
    private string $location = '';

    // The combined date+time from the form. On SQL Server, Doctrine's 'datetime'
    // type maps to a DATETIME2 column — exactly the value the Vue form builds.
    #[ORM\Column(name: 'occurred_at', type: 'datetime')]
    private ?\DateTimeInterface $occurredAt = null;

    // nullable: true => the column allows NULL (description is optional).
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 20)]
    private string $status = 'draft';

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private ?\DateTimeInterface $createdAt = null;

    // RELATIONSHIP: one incident has many participants.
    //   - mappedBy: 'incidentReport' = the property on Participant that owns the
    //     foreign key (the `participant.incident_report_id` column).
    //   - cascade: ['persist','remove'] = when we save/delete the incident,
    //     Doctrine automatically saves/deletes its participants too. This is how
    //     one $em->persist($report) writes to several tables at once.
    //   - orphanRemoval: true = removing a participant from this collection
    //     deletes its row.
    #[ORM\OneToMany(
        mappedBy: 'incidentReport',
        targetEntity: Participant::class,
        cascade: ['persist', 'remove'],
        orphanRemoval: true,
    )]
    private Collection $participants;

    public function __construct()
    {
        // A "to-many" side is always a Collection. Initialise it here so it's
        // never null. `createdAt` is stamped on the server, not trusted from JSON.
        $this->participants = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    // --- Getters / setters -------------------------------------------------
    // Setters return $this ("fluent" style) so calls can be chained.

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getLocation(): string
    {
        return $this->location;
    }

    public function setLocation(string $location): self
    {
        $this->location = $location;
        return $this;
    }

    public function getOccurredAt(): ?\DateTimeInterface
    {
        return $this->occurredAt;
    }

    public function setOccurredAt(?\DateTimeInterface $occurredAt): self
    {
        $this->occurredAt = $occurredAt;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    /** @return Collection<int, Participant> */
    public function getParticipants(): Collection
    {
        return $this->participants;
    }

    // Helper that keeps BOTH sides of the relationship in sync: it adds the
    // participant here AND sets this incident on the participant (so the foreign
    // key is filled). Always update both sides in Doctrine.
    public function addParticipant(Participant $participant): self
    {
        if (!$this->participants->contains($participant)) {
            $this->participants->add($participant);
            $participant->setIncidentReport($this);
        }
        return $this;
    }
}

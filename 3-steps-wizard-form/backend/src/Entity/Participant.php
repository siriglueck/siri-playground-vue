<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

// ---------------------------------------------------------------------------
// Participant  ->  table `participant`
// ---------------------------------------------------------------------------
// Each person involved in an incident. This is the "owning side" of the link
// to IncidentReport, meaning THIS table holds the foreign-key column.
// ---------------------------------------------------------------------------
#[ORM\Entity]
#[ORM\Table(name: 'participant')]
class Participant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // The "many" side of many-participants-to-one-incident.
    //   - inversedBy: 'participants' points back to IncidentReport's collection.
    //   - JoinColumn defines the actual FK column: participant.incident_report_id
    //   - nullable: false => a participant must belong to an incident.
    #[ORM\ManyToOne(targetEntity: IncidentReport::class, inversedBy: 'participants')]
    #[ORM\JoinColumn(name: 'incident_report_id', referencedColumnName: 'id', nullable: false)]
    private ?IncidentReport $incidentReport = null;

    #[ORM\Column(length: 120)]
    private string $name = '';

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $role = null;

    // A real boolean column (TINYINT/BIT depending on the DB).
    #[ORM\Column]
    private bool $injured = false;

    // RELATIONSHIP: a participant may have one Injury record (only when injured).
    //   - mappedBy: 'participant' => Injury owns the FK (injury.participant_id).
    //   - The `?Injury` type + nullable means "no injury row" is valid.
    //   - cascade persist/remove so saving the participant saves its injury.
    #[ORM\OneToOne(
        mappedBy: 'participant',
        targetEntity: Injury::class,
        cascade: ['persist', 'remove'],
        orphanRemoval: true,
    )]
    private ?Injury $injury = null;

    // --- Getters / setters -------------------------------------------------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getIncidentReport(): ?IncidentReport
    {
        return $this->incidentReport;
    }

    public function setIncidentReport(?IncidentReport $incidentReport): self
    {
        $this->incidentReport = $incidentReport;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(?string $role): self
    {
        $this->role = $role;
        return $this;
    }

    public function isInjured(): bool
    {
        return $this->injured;
    }

    public function setInjured(bool $injured): self
    {
        $this->injured = $injured;
        return $this;
    }

    public function getInjury(): ?Injury
    {
        return $this->injury;
    }

    // Keep both sides in sync, like addParticipant() did.
    public function setInjury(?Injury $injury): self
    {
        $this->injury = $injury;
        if ($injury !== null) {
            $injury->setParticipant($this);
        }
        return $this;
    }
}

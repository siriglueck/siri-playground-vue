<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

// ---------------------------------------------------------------------------
// Injury  ->  table `injury`
// ---------------------------------------------------------------------------
// The injury details for a participant. Holds the FK to participant, and is the
// parent of the first-aid rows. This is where `injuryDetails` + `firstAid[]`
// from the JSON land.
// ---------------------------------------------------------------------------
#[ORM\Entity]
#[ORM\Table(name: 'injury')]
class Injury
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Owning side of the one-to-one. This table gets the `participant_id` column.
    #[ORM\OneToOne(targetEntity: Participant::class, inversedBy: 'injury')]
    #[ORM\JoinColumn(name: 'participant_id', referencedColumnName: 'id', nullable: false)]
    private ?Participant $participant = null;

    #[ORM\Column(type: 'text')]
    private string $details = '';

    // One injury can have many first-aid measures (an array in the JSON becomes
    // many rows in `first_aid_used`).
    #[ORM\OneToMany(
        mappedBy: 'injury',
        targetEntity: FirstAidUsed::class,
        cascade: ['persist', 'remove'],
        orphanRemoval: true,
    )]
    private Collection $firstAidsUsed;

    public function __construct()
    {
        $this->firstAidsUsed = new ArrayCollection();
    }

    // --- Getters / setters -------------------------------------------------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getParticipant(): ?Participant
    {
        return $this->participant;
    }

    public function setParticipant(?Participant $participant): self
    {
        $this->participant = $participant;
        return $this;
    }

    public function getDetails(): string
    {
        return $this->details;
    }

    public function setDetails(string $details): self
    {
        $this->details = $details;
        return $this;
    }

    /** @return Collection<int, FirstAidUsed> */
    public function getFirstAidsUsed(): Collection
    {
        return $this->firstAidsUsed;
    }

    public function addFirstAidUsed(FirstAidUsed $firstAidUsed): self
    {
        if (!$this->firstAidsUsed->contains($firstAidUsed)) {
            $this->firstAidsUsed->add($firstAidUsed);
            $firstAidUsed->setInjury($this);
        }
        return $this;
    }
}

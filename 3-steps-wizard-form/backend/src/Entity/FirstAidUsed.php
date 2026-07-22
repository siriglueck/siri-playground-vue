<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

// ---------------------------------------------------------------------------
// FirstAidUsed  ->  table `first_aid_used`
// ---------------------------------------------------------------------------
// One row per first-aid measure applied to an injury. Because the JSON has
// `firstAid: ["Bandage", "Disinfection"]`, we create ONE row per array item.
// This is how you normalise a list into a child table.
// ---------------------------------------------------------------------------
#[ORM\Entity]
#[ORM\Table(name: 'first_aid_used')]
class FirstAidUsed
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Owning side: this table holds `injury_id`.
    #[ORM\ManyToOne(targetEntity: Injury::class, inversedBy: 'firstAidsUsed')]
    #[ORM\JoinColumn(name: 'injury_id', referencedColumnName: 'id', nullable: false)]
    private ?Injury $injury = null;

    // The measure itself, e.g. "Bandage / dressing".
    #[ORM\Column(length: 120)]
    private string $aid = '';

    // --- Getters / setters -------------------------------------------------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getInjury(): ?Injury
    {
        return $this->injury;
    }

    public function setInjury(?Injury $injury): self
    {
        $this->injury = $injury;
        return $this;
    }

    public function getAid(): string
    {
        return $this->aid;
    }

    public function setAid(string $aid): self
    {
        $this->aid = $aid;
        return $this;
    }
}

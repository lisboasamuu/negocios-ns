export const business = {
  name: "Clínica NS",
  shortName: "NS",
  tagline: "Sua beleza, com naturalidade.",
  whatsapp: "5511999999999",
  whatsappDisplay: "(11) 99999-9999 — número demonstrativo",
  whatsappMessage:
    "Olá! Conheci a Clínica NS pelo site e gostaria de agendar uma avaliação.",
  address: "Endereço a definir",
  instagram: "Perfil do Instagram a definir",
  instagramUrl: "#contato",
  openingHours: "Horários de atendimento a definir",
  contactIsPlaceholder: true,
} as const;

export const whatsappUrl = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
  business.whatsappMessage,
)}`;

export const navigation = [
  { label: "Início", href: "#inicio" },
  { label: "Tratamentos", href: "#tratamentos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Contato", href: "#contato" },
] as const;

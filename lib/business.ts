export const business = {
  name: "Clínica NS",
  shortName: "NS",
  tagline: "Sua beleza, com naturalidade.",
  whatsapp: "5519995376340",
  whatsappDisplay: "(19) 99537-6340",
  whatsappMessage:
    "Olá! Conheci a Clínica NS pelo site e gostaria de agendar uma avaliação.",
  address: "Rua Nathali Matias, 123, Cidade NS",
  instagram: "@codigonsbr",
  instagramUrl: "https://www.instagram.com/codigonsbr",
  openingHours: "Seg–sex, 9h–18h · sáb, 9h–13h",
  contactIsPlaceholder: false,
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

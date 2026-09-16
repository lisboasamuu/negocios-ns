export const business = {
  name: "Clínica NS",
  shortName: "NS",
  tagline: "Sua beleza, com naturalidade.",
  whatsapp: "5519995376340",
  whatsappDisplay: "(19) 99537-6340",
  whatsappMessage:
    "Olá! Conheci a Clínica NS pelo site e gostaria de agendar uma avaliação.",
  address: "Rua Nathali Samuel, 123, Cidade NS",
  instagram: "@codigonsbr",
  instagramUrl: "https://www.instagram.com/codigonsbr",
  openingHours: "Seg–sex, 9h–18h · sáb, 9h–13h",
  contactIsPlaceholder: false,
} as const;

export function createWhatsappUrl(message: string) {
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const whatsappUrl = createWhatsappUrl(business.whatsappMessage);

export const whatsappSupportActions = [
  {
    title: "Reagendar um horário",
    description: "Conte qual horário você reservou e qual nova data prefere.",
    href: createWhatsappUrl("Olá! Gostaria de reagendar um horário na Clínica NS."),
  },
  {
    title: "Cancelar um agendamento",
    description: "Fale com a equipe para cancelar com segurança e confirmar a alteração.",
    href: createWhatsappUrl("Olá! Gostaria de cancelar um agendamento na Clínica NS."),
  },
  {
    title: "Tirar uma dúvida",
    description: "Converse com a equipe sobre serviços, preparo ou atendimento.",
    href: createWhatsappUrl("Olá! Tenho uma dúvida sobre os atendimentos da Clínica NS."),
  },
] as const;

export const navigation = [
  { label: "Início", href: "#inicio" },
  { label: "Tratamentos", href: "#tratamentos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Contato", href: "#contato" },
] as const;

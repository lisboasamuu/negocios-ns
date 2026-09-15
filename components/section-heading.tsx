type SectionHeadingProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({ id, eyebrow, title, description, align = "left" }: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-title mt-4">{title}</h2>
      {description ? <p className="body-copy mt-5">{description}</p> : null}
    </div>
  );
}

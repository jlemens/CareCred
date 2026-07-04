type Props = {
  label: string;
  recommended?: boolean;
  className?: string;
};

/** Consistent label + optional/recommended suffix for survey fields. */
export function SurveyQuestionLabel({
  label,
  recommended = false,
  className = "text-sm leading-snug text-foreground",
}: Props) {
  return (
    <span className={className}>
      {label}{" "}
      <span className="font-normal whitespace-nowrap text-muted">
        {recommended ? "(recommended, optional)" : "(optional)"}
      </span>
    </span>
  );
}

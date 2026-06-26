import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FilterType } from "../types";

interface Props {
  value: FilterType;
  onChange: (value: FilterType) => void;
}

const OPTIONS: FilterType[] = ["All", "Event", "Result", "General", "Placement"];

export function TypeFilter({ value, onChange }: Props) {
  return (
    <Stack direction="row" justifyContent="center">
      <ToggleButtonGroup
        value={value}
        exclusive
        size="small"
        onChange={(_event, next) => {
          if (next) {
            onChange(next as FilterType);
          }
        }}
      >
        {OPTIONS.map((option) => (
          <ToggleButton key={option} value={option}>
            {option}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

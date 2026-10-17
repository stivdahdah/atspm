// In StyledPaper.tsx
import type { PaperProps } from '@mui/material/Paper'
import Paper from '@mui/material/Paper'

export const StyledPaper = ({ children, sx }: PaperProps) => {
  return <Paper sx={{ ...sx }}>{children}</Paper>
}

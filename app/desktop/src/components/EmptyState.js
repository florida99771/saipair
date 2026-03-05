import { Box, Typography, Button } from '@mui/material';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Box
      sx={{
        py: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        color: 'text.disabled',
      }}
    >
      {Icon && <Icon sx={{ fontSize: 48, opacity: 0.4 }} />}
      <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{title}</Typography>
      {description && (
        <Typography sx={{ fontSize: 13 }}>{description}</Typography>
      )}
      {action && (
        <Button
          variant="outlined"
          onClick={action.onClick}
          sx={{ mt: 1, fontSize: 14, borderRadius: 2 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

// Override default Button styles
const StyledButton = styled(Button)({
  width: '100%',
  height: '60px',
});

// Apply globally so all Button instances get updated
export default StyledButton;
import { styled } from '@mui/material/styles';
import Select from '@mui/material/Select';

// Styled version of MUI Select
const StyledSelect = styled(Select)({
  borderRadius: '8px',
  width: '100%',
  '& .MuiSelect-select': {
    padding: '10px',
    color: 'white',
  },
  '& .MuiSvgIcon-root': {
    color: 'white', // Ensures dropdown arrow is white
  },
});

export default StyledSelect;

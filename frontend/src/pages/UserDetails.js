import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Logout as LogoutIcon,
  Movie as MovieIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(22, 33, 62, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  padding: theme.spacing(3),
  maxWidth: '600px',
  width: '100%',
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  margin: '0 auto',
  backgroundColor: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  border: `4px solid ${theme.palette.secondary.main}`,
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  marginBottom: theme.spacing(1.5),
}));

const UserDetails = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  // Get initials for avatar
  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Container 
      component="main" 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        px: 2
      }}
    >
      <StyledCard>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <MovieIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Outdoor Cinema
            </Typography>
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Welcome back, {user.firstName}!
          </Typography>
          <Chip 
            label="Verified Member" 
            color="secondary" 
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <UserAvatar>
            {getInitials() || <PersonIcon sx={{ fontSize: 60 }} />}
          </UserAvatar>
        </Box>

        <CardContent>
          <InfoItem>
            <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Full Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.firstName} {user.lastName}
              </Typography>
            </Box>
          </InfoItem>

          <InfoItem>
            <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Email Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.email}
              </Typography>
            </Box>
          </InfoItem>

          <InfoItem>
            <CalendarIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Member Since
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
            </Box>
          </InfoItem>
        </CardContent>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            size="large"
            sx={{ 
              py: 1.5, 
              px: 4,
              borderRadius: '30px',
            }}
          >
            Sign Out
          </Button>
        </Box>
      </StyledCard>
    </Container>
  );
};

export default UserDetails;

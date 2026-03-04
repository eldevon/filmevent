import React, { useState } from 'react';
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
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Logout as LogoutIcon,
  Movie as MovieIcon,
  CalendarToday as CalendarIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import { uploadAvatar, sendEvent } from '../services/awsService';

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
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  marginBottom: theme.spacing(1.5),
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UserDetails = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      showSnackbar('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      showSnackbar('File size must be less than 5MB', 'error');
      return;
    }

    setUploading(true);
    setUploadError('');
    
    try {
      const result = await uploadAvatar(user.id, file);
      
      if (result.success) {
        setAvatarUrl(result.url);
        setAvatar(file);
        setUploadSuccess(true);
        showSnackbar('Avatar uploaded successfully!', 'success');
        
        // Send event about avatar update to SQS
        await sendEvent('AVATAR_UPDATED', {
          userId: user.id,
          avatarUrl: result.url,
          fileName: file.name,
          fileSize: file.size,
          timestamp: new Date().toISOString()
        });
        
        console.log('Avatar update event sent to SQS');
      } else {
        setUploadError(result.error || 'Failed to upload avatar');
        showSnackbar(result.error || 'Failed to upload avatar', 'error');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError('Error uploading avatar. Please try again.');
      showSnackbar('Error uploading avatar. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (!user) {
    return null;
  }

  // Get initials for avatar
  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  // Get avatar display source
  const getAvatarSrc = () => {
    if (avatarUrl) return avatarUrl;
    if (avatar) return URL.createObjectURL(avatar);
    return null;
  };

  const avatarSrc = getAvatarSrc();

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
          <label htmlFor="avatar-upload">
            <UserAvatar
              src={avatarSrc}
              sx={{ cursor: uploading ? 'default' : 'pointer' }}
            >
              {!avatarSrc && (getInitials() || <PersonIcon sx={{ fontSize: 60 }} />)}
            </UserAvatar>
          </label>
          
          <VisuallyHiddenInput
            accept="image/*"
            id="avatar-upload"
            type="file"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
          
          <Box sx={{ mt: 2 }}>
            <Button
              component="span"
              variant="outlined"
              size="small"
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              disabled={uploading}
              onClick={() => document.getElementById('avatar-upload').click()}
            >
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </Button>
          </Box>
          
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {uploadError}
            </Alert>
          )}
          
          {uploadSuccess && !uploadError && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              Avatar uploaded successfully!
            </Alert>
          )}
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserDetails;

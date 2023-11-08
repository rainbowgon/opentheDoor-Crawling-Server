const axios = require('axios');
const GOOGLE_API_KEY = 'AIzaSyC-tlGCnzlo1qrL5K2mYeUD_1eP5ZjYa1Q'; // Google Maps API 키

const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: GOOGLE_API_KEY
      }
    });

    if (response.data.status === 'OK') {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      throw new Error(response.data.error_message || 'Geocoding failed');
    }
  } catch (error) {
    console.error('Error in geocoding:', error);
    return null;
  }
};


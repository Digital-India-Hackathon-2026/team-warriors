import express from 'express';

const router = express.Router();

// Mock database of government office templates per state
const STATE_OFFICES = {
  "Andhra Pradesh": [
    { name: "Gram Panchayat Secretariat", type: "Panchayat Office", address: "Guntur Rural, Andhra Pradesh", phone: "+91 86322 34221", lat: 16.3067, lng: 80.4365 },
    { name: "Mandal Parishad Development Office (MPDO)", type: "Block Office", address: "Mangalagiri Mandal, Andhra Pradesh", phone: "+91 86452 72109", lat: 16.4320, lng: 80.5620 },
    { name: "Meeseva Center (CSC)", type: "Common Service Centre", address: "Beside Main Road, Vijayawada, AP", phone: "+91 98481 23456", lat: 16.5062, lng: 80.6480 },
    { name: "District Collector Office", type: "District Administration", address: "Collectorate Road, Guntur, AP", phone: "+91 86322 34924", lat: 16.3000, lng: 80.4500 }
  ],
  "Telangana": [
    { name: "Gram Panchayat Office", type: "Panchayat Office", address: "Medchal Mandal, Telangana", phone: "+91 84182 22123", lat: 17.6293, lng: 78.4815 },
    { name: "Mandal Revenue Office (MRO)", type: "Block Office", address: "Kukatpally, Hyderabad, Telangana", phone: "+91 40233 44556", lat: 17.4875, lng: 78.3953 },
    { name: "TS-Online Meeseva (CSC)", type: "Common Service Centre", address: "Madhapur Main Rd, Hyderabad, Telangana", phone: "+91 99887 76655", lat: 17.4483, lng: 78.3915 },
    { name: "Hyderabad Collectorate", type: "District Administration", address: "Nampally, Hyderabad, Telangana", phone: "+91 40232 02112", lat: 17.3916, lng: 78.4664 }
  ],
  "Delhi": [
    { name: "SDM Office (Vasant Vihar)", type: "Sub-Divisional Magistrate", address: "Palika Bhawan, RK Puram, New Delhi", phone: "+91 11261 63939", lat: 28.5746, lng: 77.1856 },
    { name: "Jeevan Pramaan CSC Center", type: "Common Service Centre", address: "Connaught Place, New Delhi", phone: "+91 91122 33445", lat: 28.6304, lng: 77.2177 },
    { name: "District Magistrate Office (New Delhi)", type: "District Administration", address: "12/1 Jam Nagar House, Shahjahan Road, New Delhi", phone: "+91 11233 86984", lat: 28.6080, lng: 77.2280 }
  ]
};

// Default generic templates for other states
const GENERIC_TEMPLATES = [
  { name: "Common Service Centre (CSC) - Digital Seva", type: "Common Service Centre", address: "Main Market Area", phone: "+91 99999 88888", lat_offset: 0.015, lng_offset: -0.012 },
  { name: "Block Development Office (BDO)", type: "Block Office", address: "Tehsil Headquarters", phone: "+91 11111 22222", lat_offset: -0.024, lng_offset: 0.035 },
  { name: "Gram Panchayat Bhawan", type: "Panchayat Office", address: "Village Center", phone: "+91 33333 44444", lat_offset: 0.005, lng_offset: 0.008 },
  { name: "District Collectorate Complex", type: "District Administration", address: "District Head Office", phone: "+91 55555 66666", lat_offset: 0.051, lng_offset: -0.045 }
];

router.get('/', (req, res) => {
  const { lat, lng, state } = req.query;
  
  let offices = [];
  
  if (state && STATE_OFFICES[state]) {
    // If state is selected, return specific offices for that state
    offices = STATE_OFFICES[state].map((office, idx) => ({
      ...office,
      id: `state-${idx}`,
      distance: (2.5 + idx * 1.8).toFixed(1) // simulated km
    }));
  } else if (lat && lng) {
    // If geo-coordinates are provided, generate nearby offices surrounding the user's location
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    
    offices = GENERIC_TEMPLATES.map((tpl, idx) => ({
      id: `geo-${idx}`,
      name: tpl.name,
      type: tpl.type,
      address: `${tpl.address}, Nearby Area`,
      phone: tpl.phone,
      lat: centerLat + tpl.lat_offset,
      lng: centerLng + tpl.lng_offset,
      distance: (Math.sqrt(Math.pow(tpl.lat_offset, 2) + Math.pow(tpl.lng_offset, 2)) * 111).toFixed(1) // rough lat-degree to km
    }));
  } else {
    // Default fallback to Telangana offices if no parameters provided
    offices = STATE_OFFICES["Telangana"].map((office, idx) => ({
      ...office,
      id: `default-${idx}`,
      distance: (1.2 + idx * 2.2).toFixed(1)
    }));
  }
  
  res.json(offices);
});

export default router;

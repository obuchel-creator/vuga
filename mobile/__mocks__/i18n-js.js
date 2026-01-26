const translations = {
  traffic: 'Kampala Traffic',
  login: 'Login',
  noAccount: 'No account? Register',
  register: 'Register',
  haveAccount: 'Have an account? Login',
  Comments: 'Comments',
  Profile: 'Profile',
  Report: 'Report',
  'Email (or leave blank if using phone)': 'Email (or leave blank if using phone)',
  Password: 'Password',
  'Report Traffic Jam': 'Report Traffic Jam',
};

module.exports = {
  t: (key) => translations[key] || key,
  locale: 'en-UG',
};

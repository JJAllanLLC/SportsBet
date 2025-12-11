// Sticky header effect

window.addEventListener('scroll', () => {

  const header = document.querySelector('header');

  header.style.boxShadow = window.scrollY > 100 

    ? '0 4px 20px rgba(0,0,0,0.15)' 

    : 'none';

});



// Login functionality is now handled by auth.js


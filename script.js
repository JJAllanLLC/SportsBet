// Sticky header effect

window.addEventListener('scroll', () => {

  const header = document.querySelector('header');

  header.style.boxShadow = window.scrollY > 100 

    ? '0 4px 20px rgba(0,0,0,0.15)' 

    : 'none';

});



// Temporary alert for points login (real login comes tomorrow)

document.querySelector('.login')?.addEventListener('click', (e) => {

  e.preventDefault();

  alert('Points dashboard + real login launching tomorrow! Get ready to earn Amazon cards.');

});


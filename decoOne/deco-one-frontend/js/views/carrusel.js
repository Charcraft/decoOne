document.querySelectorAll('.gallery img').forEach(imagen => {
    imagen.addEventListener('click', () => {
        document.querySelector('.gallery img.activa')?.classList.remove('activa');
        imagen.classList.add('activa');
    });
});
document.querySelector('.gallery img')?.classList.add('activa');
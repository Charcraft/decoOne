document.addEventListener('DOMContentLoaded', () => {
    cargarSalones();
    inicializarModal();
});

const SERVER_URL = 'http://localhost:7000';
let modoEdicion = false;
let idSalonSeleccionado = null;

async function cargarSalones() {
    try {
        const respuesta = await fetch(`${SERVER_URL}/api/salones`);
        const salones = await respuesta.json();
        renderizarSalones(salones);
    } catch (error) {
        console.error('Error al cargar salones:', error);
    }
}

function renderizarSalones(salones) {
    const contenedor = document.getElementById('gridSalones');
    contenedor.innerHTML = '';

    if (salones.length === 0) {
        contenedor.innerHTML = '<p style="color: white;">No hay salones registrados.</p>';
        return;
    }

    salones.forEach(salon => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-salon';
        tarjeta.innerHTML = `
            <div class="tarjeta-salon-contenido" style="position: relative;">
                <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; z-index: 10;">
                    <button class="btnEditarSalon" data-id="${salon.id}" style="background: #112a31; border: 1px solid #284e59; color: #46c4be; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                    </button>
                    <button class="btnEliminarSalon" data-id="${salon.id}" style="background: #112a31; border: 1px solid #284e59; color: #ff5252; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
                <img src="${salon.imagen_url || 'https://via.placeholder.com/400x300'}" alt="${salon.nombre}" onerror="this.src='https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'">
                <h3 style="font-weight: bold; margin-bottom: 5px;">${salon.nombre}</h3>
                <h3 style="font-weight: normal; font-size: 14px; color: #8fa0a8; margin-bottom: 15px;">${salon.horario}</h3>
                <p style="margin-bottom: 10px; font-size: 13px;">${salon.direccion}</p>
                <p style="font-size: 13px; color: #46c4be;">Contacto: ${salon.contacto}</p>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });

    if (window.lucide) {
        lucide.createIcons();
    }

    document.querySelectorAll('.btnEditarSalon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const salon = salones.find(s => s.id == id);
            abrirModalEditar(salon);
        });
    });

    document.querySelectorAll('.btnEliminarSalon').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('¿Estás seguro de eliminar este salón?')) {
                await eliminarSalon(id);
            }
        });
    });
}

function inicializarModal() {
    const modal = document.getElementById('modalSalon');
    const form = document.getElementById('formularioSalon');
    
    document.getElementById('botonAbrirModalSalon').addEventListener('click', () => {
        modoEdicion = false;
        idSalonSeleccionado = null;
        document.getElementById('modalSalonTitulo').textContent = 'Agregar Salón';
        form.reset();
        modal.style.display = 'flex';
    });

    document.getElementById('btnCerrarModalSalon').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('btnCancelarSalon').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('inputFileImagenSalon');
        let imagen_url = document.getElementById('inputImagenSalon').value;

        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                imagen_url = event.target.result;
                await guardarSalonDatos(imagen_url);
            };
            reader.readAsDataURL(file);
        } else {
            await guardarSalonDatos(imagen_url);
        }

        async function guardarSalonDatos(imgUrl) {
            const salon = {
                nombre: document.getElementById('inputNombreSalon').value,
                horario: document.getElementById('inputHorarioSalon').value,
                direccion: document.getElementById('inputDireccionSalon').value,
                contacto: document.getElementById('inputContactoSalon').value,
                imagen_url: imgUrl
            };

            if (modoEdicion) {
                await actualizarSalon(idSalonSeleccionado, salon);
            } else {
                await crearSalon(salon);
            }

            modal.style.display = 'none';
            cargarSalones();
        }
    });
}

function abrirModalEditar(salon) {
    modoEdicion = true;
    idSalonSeleccionado = salon.id;
    document.getElementById('modalSalonTitulo').textContent = 'Editar Salón';
    
    document.getElementById('inputNombreSalon').value = salon.nombre;
    document.getElementById('inputHorarioSalon').value = salon.horario;
    document.getElementById('inputDireccionSalon').value = salon.direccion;
    document.getElementById('inputContactoSalon').value = salon.contacto;
    document.getElementById('inputImagenSalon').value = salon.imagen_url;

    document.getElementById('modalSalon').style.display = 'flex';
}

async function crearSalon(salon) {
    try {
        await fetch(`${SERVER_URL}/api/salones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salon)
        });
    } catch (error) {
        console.error('Error al crear salón:', error);
    }
}

async function actualizarSalon(id, salon) {
    try {
        await fetch(`${SERVER_URL}/api/salones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salon)
        });
    } catch (error) {
        console.error('Error al actualizar salón:', error);
    }
}

async function eliminarSalon(id) {
    try {
        await fetch(`${SERVER_URL}/api/salones/${id}`, {
            method: 'DELETE'
        });
        cargarSalones();
    } catch (error) {
        console.error('Error al eliminar salón:', error);
    }
}

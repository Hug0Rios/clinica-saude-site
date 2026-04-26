// Menu Mobile Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Fechar menu ao clicar em um link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Função de scroll suave
function scroll_to(section) {
    const element = document.getElementById(section);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
}

// Formulário de Agendamento
const form = document.getElementById('appointmentForm');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Pegando os valores do formulário
        const nome = form.querySelector('input[type="text"]').value;
        const email = form.querySelector('input[type="email"]').value;
        const telefone = form.querySelector('input[type="tel"]').value;
        const data = document.getElementById('data-consulta').value;
        const horario = document.getElementById('horario-selecionado').value;
        const servico = form.querySelector('select').value;
        const mensagem = form.querySelector('textarea').value;
        
        // Validar campos obrigatórios
        if (!nome || !email || !telefone || !data || !horario || servico === 'Selecione um serviço') {
            alert('Por favor, preencha todos os campos obrigatórios, incluindo a data e horário!');
            return;
        }
        
        // Simulando envio do formulário
        console.log({
            nome,
            email,
            telefone,
            data,
            horario,
            servico,
            mensagem
        });
        
        // Mensagem de sucesso
        alert(`Obrigado ${nome}! Sua consulta foi marcada para ${data} às ${horario}. Entraremos em contato em breve para confirmar!`);
        
        // Limpar formulário
        form.reset();
        document.getElementById('horario-selecionado').value = '';
        
        // Em um projeto real, você enviaria para um servidor
        // Exemplo com fetch:
        /*
        fetch('/api/agendamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                email,
                telefone,
                data,
                horario,
                servico,
                mensagem
            })
        })
        .then(response => response.json())
        .then(data => {
            alert('Agendamento realizado com sucesso!');
            form.reset();
        })
        .catch(error => console.error('Erro:', error));
        */
    });
}

// Adicionar animação aos elementos quando aparecem na tela
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Aplicar observer aos cards
document.querySelectorAll('.service-card, .professional-card, .service-item').forEach(card => {
    observer.observe(card);
});

// Definir animação
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Efeito de scroll na navbar
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// ========== CARROSSEL DE IMAGENS ==========
const carouselTrack = document.querySelector('.carousel-track');
const carouselImages = document.querySelectorAll('.carousel-track img');

if (carouselTrack && carouselImages.length > 0) {
    let currentIndex = 0;

    function showImage(index) {
        carouselTrack.style.transform = `translateX(-${index * 100}%)`;
    }

    function nextImage() {
        currentIndex = (currentIndex + 1) % carouselImages.length;
        showImage(currentIndex);
    }

    // Auto-play a cada 3 segundos
    setInterval(nextImage, 3000);
}

// ========== ANIMAÇÕES DE ENTRADA DA PÁGINA ==========
document.addEventListener('DOMContentLoaded', () => {
    // Animação do carrossel
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        setTimeout(() => {
            carousel.classList.add('animate-in');
        }, 200);
    }

    // Animação do título do carrossel
    const carouselTitle = document.querySelector('.carousel-title');
    if (carouselTitle) {
        setTimeout(() => {
            carouselTitle.classList.add('animate-in');
        }, 600);
    }

    // Animação da seção about
    const aboutSection = document.querySelector('.about');
    if (aboutSection) {
        setTimeout(() => {
            aboutSection.classList.add('animate-in');
        }, 800);
    }

    // Animação dos elementos de texto da seção about
    const aboutTexts = document.querySelectorAll('.about-text h3, .about-text p, .diferentials li');
    aboutTexts.forEach((text, index) => {
        setTimeout(() => {
            text.classList.add('animate-in');
        }, 1000 + (index * 200));
    });

    // Animação do botão voltar
    const backButton = document.querySelector('.back-to-home');
    if (backButton) {
        setTimeout(() => {
            backButton.classList.add('animate-in');
        }, 1400);
    }

    // Animação do footer
    const footer = document.querySelector('footer');
    if (footer) {
        setTimeout(() => {
            footer.classList.add('animate-in');
        }, 1600);
    }
});

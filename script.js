// Menu Mobile Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
    });
}

// Fechar menu ao clicar em um link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    });
});

// Função de scroll suave
function scroll_to(section) {
    const element = document.getElementById(section);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }
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
document.querySelectorAll('.service-card, .professional-card, .service-item, .service-detail, .rating-card, .user-review-card').forEach(card => {
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
    const getBasePath = () => {
        const path = window.location.pathname.replace(/\\/g, '/');
        if (path.includes('/paginas/profissionais/')) return '../../';
        if (path.includes('/paginas/')) return '../';
        return '';
    };

    const basePath = getBasePath();

    if (!document.querySelector('.topbar')) {
        const topbar = document.createElement('div');
        topbar.className = 'topbar';
        topbar.innerHTML = `
            <div class="container topbar-content">
                <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Centro - Juiz de Fora - MG</span>
                <span><i class="fa-solid fa-phone" aria-hidden="true"></i> (32) 2102-7700</span>
                <span><i class="fa-solid fa-envelope" aria-hidden="true"></i> contato@clinicavitalis.com.br</span>
            </div>
        `;
        document.body.prepend(topbar);
    }

    document.querySelectorAll('.nav-link').forEach((link) => {
        if (link.getAttribute('href')?.includes('sobre_clinica.html')) {
            link.textContent = 'Empresa';
        }
    });

    const navbar = document.querySelector('.navbar .container');
    if (navbar && !navbar.querySelector('.admin-btn')) {
        const adminBtn = document.createElement('a');
        adminBtn.href = basePath + 'admin/index.html';
        adminBtn.className = 'admin-btn';
        adminBtn.textContent = 'Admin';
        navbar.appendChild(adminBtn);
    }

    const footer = document.querySelector('footer:not(.site-footer)');
    if (footer) {
        footer.className = 'site-footer';
        footer.innerHTML = `
            <div class="container footer-grid">
                <div class="footer-brand">
                    <a href="${basePath}index.html" class="logo" aria-label="Clínica Vitalis - página inicial">
                        <span class="logo-mark"><i class="fa-solid fa-heart-pulse" aria-hidden="true"></i></span>
                        <span>Clínica Vitalis</span>
                    </a>
                </div>
                <div>
                    <h3>Endereço</h3>
                    <p>Centro - Juiz de Fora - MG</p>
                    <h3>Horário de atendimento</h3>
                    <p>Segunda a sexta, mediante agendamento</p>
                </div>
                <div>
                    <h3>Contato</h3>
                    <p>(32) 2102-7700</p>
                    <p>contato@clinicavitalis.com.br</p>
                    <h3>Siga-nos</h3>
                    <p><i class="fa-brands fa-instagram" aria-hidden="true"></i> @clinicavitalis</p>
                </div>
                <div>
                    <h3>Menu</h3>
                    <a href="${basePath}index.html">Home</a>
                    <a href="${basePath}paginas/sobre_clinica.html">Empresa</a>
                    <a href="${basePath}paginas/servicos_especialidades.html">Especialidades</a>
                    <a href="${basePath}paginas/profissionais.html">Profissionais</a>
                    <a href="${basePath}paginas/agendamento.html">Agendamento</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Clínica Vitalis. Todos os direitos reservados.</p>
            </div>
        `;
    }

    if (!document.querySelector('.floating-contact')) {
        const floatingContact = document.createElement('a');
        floatingContact.className = 'floating-contact';
        floatingContact.href = `${basePath}paginas/agendamento.html`;
        floatingContact.setAttribute('aria-label', 'Agendar consulta');
        floatingContact.innerHTML = '<i class="fa-solid fa-calendar-check" aria-hidden="true"></i><span>Agendar</span>';
        document.body.appendChild(floatingContact);
    }

    const serviceToProfessional = {
        'clinica-geral': 'carlos-silva',
        cardiologia: 'marina-costa',
        odontologia: 'fernando-oliveira',
        fisioterapia: 'ana-paula',
        dermatologia: 'roberto-santos',
        nutricao: 'juliana-martins'
    };

    document.querySelectorAll('.quick-booking-form').forEach((quickForm) => {
        quickForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const selectedService = quickForm.querySelector('select')?.value;
            if (!selectedService) return;

            const professional = serviceToProfessional[selectedService];
            const quickBasePath = quickForm.dataset.basePath ?? basePath;
            window.location.href = `${quickBasePath}paginas/agendamento.html?servico=${selectedService}&profissional=${professional}`;
        });
    });

    const reviewForm = document.getElementById('reviewForm');
    const userReviewsList = document.getElementById('userReviewsList');
    const reviewFeedback = document.getElementById('reviewFeedback');
    const patientTestimonials = document.getElementById('patientTestimonials');
    const patientTestimonialsGrid = document.getElementById('patientTestimonialsGrid');
    const ratingButtons = document.querySelectorAll('.rating-star-btn');
    const reviewRating = document.getElementById('reviewRating');
    const ratingHelp = document.getElementById('ratingHelp');
    const reviewsKey = 'clinicaVitalisReviews';

    const updateInteractiveStars = (rating = 0) => {
        ratingButtons.forEach((button) => {
            const value = Number(button.dataset.rating);
            const icon = button.querySelector('i');
            const isActive = value <= Number(rating);

            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-checked', value === Number(rating) ? 'true' : 'false');

            if (icon) {
                icon.classList.toggle('fa-solid', isActive);
                icon.classList.toggle('fa-regular', !isActive);
            }
        });

        if (ratingHelp) {
            ratingHelp.textContent = rating ? `${rating} estrela${Number(rating) > 1 ? 's' : ''} selecionada${Number(rating) > 1 ? 's' : ''}` : 'Selecione uma nota';
        }
    };

    const showReviewFeedback = (message, type = 'success') => {
        if (!reviewFeedback) return;
        reviewFeedback.textContent = message;
        reviewFeedback.classList.remove('is-success', 'is-error', 'is-visible');
        reviewFeedback.classList.add(type === 'error' ? 'is-error' : 'is-success', 'is-visible');

        window.clearTimeout(showReviewFeedback.timer);
        showReviewFeedback.timer = window.setTimeout(() => {
            reviewFeedback.classList.remove('is-visible');
            reviewFeedback.textContent = '';
        }, 4500);
    };

    const getReviews = () => {
        try {
            return JSON.parse(localStorage.getItem(reviewsKey)) || [];
        } catch {
            return [];
        }
    };

    const sendReviewBackend = async (review) => {
        try {
            if (window.VITALIS_DB) {
                const ok = await window.VITALIS_DB.insert('avaliacoes', {
                    nome: review.name,
                    nota: Number(review.rating),
                    comentario: review.text,
                });
                return { success: ok };
            }
            return { success: false, offline: true };
        } catch (error) {
            console.warn('Erro ao salvar avaliação.', error);
            return { success: false, offline: true };
        }
    };

    const buildStars = (rating) => {
        const value = Number(rating) || 0;
        return Array.from({ length: 5 }, (_, i) => {
            if (value >= i + 1) return '<i class="fa-solid fa-star" aria-hidden="true"></i>';
            if (value >= i + 0.5) return '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>';
            return '<i class="fa-regular fa-star" aria-hidden="true"></i>';
        }).join('');
    };

    const buildSummaryStars = (avg) => {
        return Array.from({ length: 5 }, (_, i) => {
            if (avg >= i + 1) return '<i class="fa-solid fa-star"></i>';
            if (avg >= i + 0.5) return '<i class="fa-solid fa-star-half-stroke"></i>';
            return '<i class="fa-regular fa-star"></i>';
        }).join('');
    };

    const updateRatingSummary = (reviews) => {
        const ratingScore = document.querySelector('.rating-score strong');
        const ratingLabel = document.querySelector('.rating-score small');
        const ratingStars = document.querySelector('.rating-stars');
        if (!ratingScore || !ratingLabel) return;

        if (reviews.length === 0) {
            ratingScore.textContent = '4,9';
            ratingLabel.textContent = 'média entre pacientes atendidos';
            if (ratingStars) ratingStars.innerHTML = buildSummaryStars(4.9);
            return;
        }

        const average = reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
        ratingScore.textContent = average.toFixed(1).replace('.', ',');
        ratingLabel.textContent = `${reviews.length} avaliação${reviews.length > 1 ? 'ões' : ''} enviada${reviews.length > 1 ? 's' : ''}`;
        if (ratingStars) ratingStars.innerHTML = buildSummaryStars(average);
    };

    const dbToReview = (r) => ({
        name:   r.nome,
        rating: r.nota,
        text:   r.comentario,
        date:   new Date(r.criado_em).toLocaleDateString('pt-BR'),
    });

    const renderReviews = async () => {
        if (!userReviewsList) return;

        let reviews = [];
        if (window.VITALIS_DB) {
            const rows = await window.VITALIS_DB.select(
                'avaliacoes',
                'select=id,nome,nota,comentario,criado_em&aprovada=eq.true&order=criado_em.desc&limit=100'
            );
            reviews = Array.isArray(rows) ? rows.map(dbToReview) : [];
        }
        if (!reviews.length) reviews = getReviews();

        updateRatingSummary(reviews);

        if (patientTestimonials && patientTestimonialsGrid) {
            if (reviews.length === 0) {
                patientTestimonials.classList.add('hidden');
                patientTestimonialsGrid.innerHTML = '';
            } else {
                patientTestimonials.classList.remove('hidden');
                patientTestimonialsGrid.innerHTML = reviews
                    .slice(0, 3)
                    .map((review) => `
                        <article class="testimonial-card">
                            <div class="testimonial-stars" aria-label="Avaliação ${review.rating} de 5">
                                ${buildStars(review.rating)}
                            </div>
                            <p>${review.text}</p>
                            <strong>${review.name}</strong>
                        </article>
                    `)
                    .join('');
            }
        }

        if (reviews.length === 0) {
            userReviewsList.innerHTML = '<p class="empty-reviews">Nenhuma avaliação enviada ainda.</p>';
            return;
        }

        userReviewsList.innerHTML = reviews
            .map((review) => `
                <article class="user-review-card">
                    <div class="user-review-stars" aria-label="Avaliação ${review.rating} de 5">
                        ${buildStars(review.rating)}
                    </div>
                    <p>${review.text}</p>
                    <strong>${review.name}</strong>
                    <small>${review.date}</small>
                </article>
            `)
            .join('');

        userReviewsList.querySelectorAll('.user-review-card').forEach((card) => {
            card.classList.add('animate-in');
        });
    };

    if (reviewForm) {
        renderReviews();

        ratingButtons.forEach((button) => {
            button.setAttribute('role', 'radio');
            button.setAttribute('aria-checked', 'false');

            button.addEventListener('mouseenter', () => {
                updateInteractiveStars(button.dataset.rating);
            });

            button.addEventListener('focus', () => {
                updateInteractiveStars(button.dataset.rating);
            });

            button.addEventListener('click', () => {
                if (reviewRating) {
                    reviewRating.value = button.dataset.rating;
                }
                updateInteractiveStars(button.dataset.rating);
            });
        });

        const interactiveRating = document.querySelector('.interactive-rating');
        if (interactiveRating) {
            interactiveRating.addEventListener('mouseleave', () => {
                updateInteractiveStars(reviewRating?.value || 0);
            });
        }

        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name   = document.getElementById('reviewName').value.trim();
            const rating = document.getElementById('reviewRating').value;
            const text   = document.getElementById('reviewText').value.trim();

            if (!name || !rating || !text) {
                showReviewFeedback('Preencha nome, nota e comentário para enviar.', 'error');
                return;
            }

            const submitBtn = reviewForm.querySelector('[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }

            const review = { name, rating, text, date: new Date().toLocaleDateString('pt-BR') };
            const result = await sendReviewBackend(review);

            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar avaliação'; }

            if (result.success) {
                reviewForm.reset();
                updateInteractiveStars(0);
                await renderReviews();
                showReviewFeedback('Avaliação enviada com sucesso! Obrigado pelo seu retorno.');
            } else {
                showReviewFeedback('Não foi possível enviar. Tente novamente em instantes.', 'error');
            }
        });
    }

    // ========== FORMULÁRIO DE CONTATO ==========
    const contatoForm = document.getElementById('contatoForm');
    const contatoFeedback = document.getElementById('contatoFeedback');
    const contatoSubmitBtn = document.getElementById('contatoSubmitBtn');

    if (contatoForm) {
        const showContatoFeedback = (message, type = 'success') => {
            if (!contatoFeedback) return;
            contatoFeedback.textContent = message;
            contatoFeedback.classList.remove('is-success', 'is-error', 'is-visible');
            contatoFeedback.classList.add(type === 'error' ? 'is-error' : 'is-success', 'is-visible');

            window.clearTimeout(showContatoFeedback.timer);
            showContatoFeedback.timer = window.setTimeout(() => {
                contatoFeedback.classList.remove('is-visible');
            }, 5000);
        };

        contatoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('contatoNome').value.trim();
            const email = document.getElementById('contatoEmail').value.trim();
            const telefone = document.getElementById('contatoTelefone').value.trim();
            const mensagem = document.getElementById('contatoMensagem').value.trim();

            if (!nome || !email || !mensagem) {
                showContatoFeedback('Preencha todos os campos obrigatórios.', 'error');
                return;
            }

            if (contatoSubmitBtn) {
                contatoSubmitBtn.disabled = true;
                contatoSubmitBtn.textContent = 'Enviando…';
            }

            try {
                let enviado = false;
                if (window.VITALIS_DB) {
                    enviado = await window.VITALIS_DB.insert('contatos', { nome, email, telefone, mensagem });
                }
                if (enviado) {
                    showContatoFeedback('Mensagem enviada com sucesso! Retornaremos em breve.');
                    contatoForm.reset();
                } else {
                    showContatoFeedback('Não foi possível enviar. Entre em contato por telefone ou e-mail.', 'error');
                }
            } catch {
                showContatoFeedback('Não foi possível enviar. Entre em contato por telefone ou e-mail.', 'error');
            } finally {
                if (contatoSubmitBtn) {
                    contatoSubmitBtn.disabled = false;
                    contatoSubmitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Enviar mensagem';
                }
            }
        });
    }

    const reveal = (selector, delay, stagger = 0) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate-in');
            }, delay + (index * stagger));
        });
    };

    reveal('.hero, .hero-agendamento, .carousel, .about, .page-heading, .company-about-block, .values-section, .testimonials-section, .clinic-rating-section, .contact-section, .company-map, .featured-services, .quick-access, .care-flow, .patient-tools, .location, .scheduling-section, .scheduling-container, .scheduling-info, .scheduling-form-container, .resumo-agendamento, .info-grid, .informacoes-uteis, .back-to-home, footer', 100);
    reveal('.carousel-title', 140);
    reveal('.hero-content h2, .hero-content p, .service-card, .service-detail, .rating-card, .user-review-card, .patient-tool-card, .quick-access-item, .featured-services h2, .location-details, .info-card, .scheduling-form-container .form-fieldset, .resumo-agendamento h3, .info-box, .informacoes-uteis h2, .contact-info-panel, .contact-form-panel', 160, 60);
    reveal('.about-text h3, .about-text p, .diferentials li, .horario-item, .info-box h3, .info-box p', 180, 50);

    const getInitials = (fullName) => {
        if (!fullName) return '';
        const cleaned = fullName
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^Dr\.?\s+/i, '')
            .replace(/^Dra\.?\s+/i, '');

        const parts = cleaned.split(' ').filter(Boolean);
        if (parts.length === 0) return '';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    document.querySelectorAll('.professional-avatar').forEach((avatar) => {
        const name = avatar.getAttribute('data-name') || '';
        const initialsEl = avatar.querySelector('.professional-initials');
        const img = avatar.querySelector('img');

        if (initialsEl) initialsEl.textContent = getInitials(name);

        const enableFallback = () => {
            avatar.classList.add('is-fallback');
            if (img) img.setAttribute('aria-hidden', 'true');
        };

        if (!img) {
            enableFallback();
            return;
        }

        // If the image fails to load (file missing), show initials.
        img.addEventListener('error', enableFallback, { once: true });

        // If it loads successfully, ensure fallback is off.
        img.addEventListener(
            'load',
            () => {
                avatar.classList.remove('is-fallback');
            },
            { once: true }
        );
    });
});

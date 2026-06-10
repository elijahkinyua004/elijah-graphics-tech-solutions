// ================= COMMENT SYSTEM =================

const commentForm = document.getElementById('commentForm');
const commentsList = document.getElementById('commentsList');

if (commentForm && commentsList) {
    commentForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // GET INPUT VALUES
        const name = document.getElementById('name').value;
        const message = document.getElementById('message').value;

        // POSITIVE WORDS FILTER
        const positiveWords = [
            'good',
            'great',
            'amazing',
            'excellent',
            'professional',
            'best',
            'nice',
            'awesome',
            'perfect',
            'quality',
            'creative',
            'superb',
            'fantastic',
            'impressed',
            'top-notch'
        ];

        // CHECK IF COMMENT IS POSITIVE
        const isPositive = positiveWords.some(word =>
            message.toLowerCase().includes(word)
        );

        // DISPLAY COMMENT IF POSITIVE
        if (isPositive) {
            const commentBox = document.createElement('div');
            commentBox.classList.add('comment-box');
            commentBox.innerHTML = `
                <i class="fas fa-quote-left" style="color: rgba(255,0,200,0.3); font-size: 1.5rem; margin-bottom: 10px; display: block;"></i>
                <h4>${name}</h4>
                <p>${message}</p>
            `;
            commentsList.prepend(commentBox); // Add new comments at the top
        } else if (message.length > 0) {
            alert('Only positive comments will appear publicly.');
        }

        // RESET FORM
        commentForm.reset();
    });
}

// ================= SCROLL NAVBAR EFFECT =================

const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function () {

    if (!navbar) return;

    if (window.scrollY > 50) {

        navbar.style.background = 'rgba(0,0,0,0.95)';
        navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';

    } else {

        navbar.style.background = 'rgba(0,0,0,0.8)';
        navbar.style.boxShadow = 'none';

    }

});


// ================= ACTIVE NAVIGATION LINK =================

const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {

    let current = '';

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;

        if (window.scrollY >= sectionTop) {

            current = section.getAttribute('id');

        }

    });

    navLinks.forEach(link => {

        link.classList.remove('active');

        if (link.getAttribute('href').includes(current)) {

            link.classList.add('active');

        }

    });

});


// ================= HERO TEXT ANIMATION =================

// Removed JavaScript text splitting to ensure instant CSS-based rendering

// ================= BUTTON HOVER EFFECT =================

// Removed JS hover effects as they conflict with CSS transitions


// ================= GALLERY UPLOAD & DISPLAY =================

const galleryImageUpload = document.getElementById('galleryImageUpload');
const uploadGalleryBtn = document.getElementById('uploadGalleryBtn');
const galleryUploadStatus = document.getElementById('galleryUploadStatus');
const galleryGrid = document.getElementById('galleryGrid');

function openFullGallery(imageId = null) {
    // Store the current image ID in session storage or URL parameter
    // to open the gallery.html at the correct image
    if (imageId) {
        sessionStorage.setItem('currentGalleryImageId', imageId);
    }
    window.open('gallery.html', '_blank'); // Open in new tab
}

// ================= FLOATING EFFECT FOR CARDS =================

const cards = document.querySelectorAll(
    '.skill-box, .project-card:not(.photo-gallery-card), .service-detail-card, .contact-form-box, .contact-info-box'
);

cards.forEach(card => {

    card.addEventListener('mousemove', (e) => {

        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.transform = `
            rotateX(${-(y - rect.height / 2) / 25}deg)
            rotateY(${(x - rect.width / 2) / 25}deg)
            translateY(-10px)
        `;

    });

    card.addEventListener('mouseleave', () => {

        card.style.transform = `
            rotateX(0deg)
            rotateY(0deg)
            translateY(0px)
        `;

    });

});

// Handle screen resize to reset any stuck transforms
window.addEventListener('resize', () => {
    cards.forEach(card => {
        card.style.transform = 'none';
    });
});


// ================= SMOOTH PAGE LOAD =================



// ================= CUSTOM CURSOR EFFECT =================

const initCursor = () => {
    const arrow = document.createElement('div');
    arrow.className = 'cursor-arrow cursor-entrance';
    arrow.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2L22 22L12 18L2 22L12 2Z"/></svg>`;
    
    // Container for the special page icons
    const extraIcon = document.createElement('div');
    extraIcon.className = 'cursor-extra-icon';
    arrow.appendChild(extraIcon);
    
    document.body.appendChild(arrow);

    const trailCount = 12;
    const trailSegments = [];
    for (let i = 0; i < trailCount; i++) {
        const seg = document.createElement('div');
        seg.className = 'trail-segment';
        document.body.appendChild(seg);
        trailSegments.push({ el: seg, x: 0, y: 0 });
    }

    let mouseX = 0, mouseY = 0, prevX = 0, prevY = 0;
    let angle = 0, velocity = 0;

    // Page detection logic
    const isGalleryPage = window.location.pathname.includes('gallery.html');
    const isPricingPage = window.location.pathname.includes('prices.html');

    // Specialized Icon SVGs
    const eyeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="4"><path d="M20 6L9 17l-5-5"/></svg>`;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        arrow.style.opacity = '1';
        
        if (arrow.classList.contains('cursor-entrance')) {
            setTimeout(() => arrow.classList.remove('cursor-entrance'), 600);
        }
    });

    const animate = () => {
        const dx = mouseX - prevX;
        const dy = mouseY - prevY;
        velocity = Math.sqrt(dx * dx + dy * dy);
        
        if (velocity > 1) {
            angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        }

        arrow.style.left = `${mouseX}px`;
        arrow.style.top = `${mouseY}px`;
        arrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

        trailSegments.forEach((seg, i) => {
            const targetX = i === 0 ? mouseX : trailSegments[i - 1].x;
            const targetY = i === 0 ? mouseY : trailSegments[i - 1].y;
            
            seg.x += (targetX - seg.x) * 0.35;
            seg.y += (targetY - seg.y) * 0.35;

            // Zigzag logic: alternate offset perpendicular to movement
            const zigzagSide = (i % 2 === 0 ? 1 : -1);
            // Reduced scaling factors for a tighter zigzag trail
            const zigzagAmount = Math.min(velocity * 0.2, 7.5) * zigzagSide; 
            const rad = (angle - 90) * Math.PI / 180;
            
            const finalX = seg.x + Math.cos(rad + Math.PI/2) * zigzagAmount;
            const finalY = seg.y + Math.sin(rad + Math.PI/2) * zigzagAmount;

            seg.el.style.left = `${finalX}px`;
            seg.el.style.top = `${finalY}px`;
            
            const speedAlpha = Math.min(velocity / 15, 1);
            const indexAlpha = 1 - (i / trailCount);
            seg.el.style.opacity = speedAlpha * indexAlpha;
            seg.el.style.transform = `translate(-50%, -50%) scale(${indexAlpha * (0.4 + speedAlpha * 0.6)})`;
        });

        prevX = mouseX;
        prevY = mouseY;
        requestAnimationFrame(animate);
    };
    animate();

    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        const isInteractable = target.closest('a, button, .btn, .tab-btn, .logo-area, .art-box, .morph-shape, .price-item, .pricing-card');
        
        if (isInteractable) {
            document.body.classList.add('cursor-hover-active');
            if (isPricingPage && target.closest('.price-item, .pricing-card, .primary-btn')) {
                extraIcon.innerHTML = checkIcon;
                extraIcon.classList.add('show');
                extraIcon.style.backgroundColor = '#ff00c8';
            }
        } else {
            document.body.classList.remove('cursor-hover-active');
            extraIcon.classList.remove('show');
        }
    });

    document.addEventListener('mouseout', () => {
        extraIcon.classList.remove('show');
    });

    document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML') {
            arrow.style.opacity = '0';
            trailSegments.forEach(s => s.el.style.opacity = '0');
        }
    });
};

initCursor();

// ================= MOTION GRAPHICS CANVAS ANIMATION WITH SCENE SYSTEM =================

const initMotionLab = () => {
    const container = document.getElementById('motion-container');
    if (!container) return;

    let activeBranchIdx = 0;
    let cycleInterval = null;

    const treeData = [
        // Vertically tightened Y coordinates to fit a shorter container
        { label: "Graphic Designer", x: 260, y: 280, anchor: "end", dx: -30, dy: 5 },
        { label: "Web Developer", x: 300, y: 200, anchor: "end", dx: -30, dy: 5 },
        { label: "Interior Designer", x: 350, y: 140, anchor: "end", dx: -30, dy: 5 },
        { label: "Event Decor Specialist", x: 400, y: 110, anchor: "middle", dx: 0, dy: -40 },
        { label: "Cake Designer & Recipe", x: 450, y: 140, anchor: "start", dx: 30, dy: 5 },
        { label: "Cyber Services", x: 500, y: 200, anchor: "start", dx: 30, dy: 5 },
        { label: "PS4 Rentals", x: 540, y: 280, anchor: "start", dx: 30, dy: 5 }
    ];

    // Generate curved paths
    const getPath = (endX, endY) => `M 400,420 Q ${endX + (400 - endX) * 0.4},420 ${endX},${endY}`;

    const injectStyles = () => {
        const styleId = 'tree-animation-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .tree-node { transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: center; transform: scale(0); }
            .tree-node.pop { transform: scale(1); }
            .tree-branch { stroke: #00FFFF; stroke-opacity: 0.4; transition: stroke-opacity 0.4s, stroke 0.4s; stroke-width: 2px; }
            .tree-branch.active { stroke: #FFFFFF; stroke-opacity: 1; stroke-width: 2.5px; }
            .tree-label { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: bold; letter-spacing: 0.05em; fill: #00FFFF; opacity: 0; transition: opacity 0.3s, transform 0.3s; pointer-events: none; paint-order: stroke; stroke: #060d1f; stroke-width: 4px; }
            .tree-label.show { opacity: 1; transform: translate(0, 0); }
            .pulse-ring { fill: none; stroke: #00FFFF; stroke-width: 1px; animation: ringPulse 2s infinite; transform-origin: center; }
            @keyframes ringPulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
            .electricity { stroke-dasharray: 4 12; animation: flow 1s linear infinite; }
            @keyframes flow { from { stroke-dashoffset: 16; } to { stroke-dashoffset: 0; } }

            /* Responsive SVG adjustments for labels and line thickness */
            @media (max-width: 480px) {
                .tree-label { font-size: 9px; stroke-width: 3px; }
                .tree-branch { stroke-width: 1.2px; }
                .tree-branch.active { stroke-width: 1.5px; }
                .tree-root-text { font-size: 11px !important; }
            }
        `;
        document.head.appendChild(style);
    };

    const buildTree = () => {
        // Detect mobile to adjust sizes of SVG elements before building the string
        const isMobile = window.innerWidth <= 480;
        const nodeRadius = isMobile ? 14 : 18; // Scaled down node size
        // Increased rootRadius slightly to provide better internal padding for multi-line text
        const rootRadius = isMobile ? 32 : 40; 
        const charWidth = isMobile ? 6 : 7.5;  // Scaled down label backgrounds
        const rootFontSize = isMobile ? 10 : 12; // Dynamic font sizing based on radius context

        let svgContent = `
            <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet" id="tree-svg">
                <filter id="neon-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <g filter="url(#neon-glow)">
                    ${treeData.map((d, i) => `
                        <path id="branch-${i}" class="tree-branch" d="${getPath(d.x, d.y)}" />
                        <path id="flow-${i}" class="tree-branch electricity" d="${getPath(d.x, d.y)}" style="display:none;"/>
                    `).join('')}
                    
                    <g id="root-group" transform="translate(400, 420)">
                        <circle class="pulse-ring" r="${rootRadius}" />
                        <circle r="${rootRadius}" fill="rgba(0, 255, 255, 0.15)" stroke="#00FFFF" stroke-width="3" />
                        <!-- Split text into two lines with tspans for perfect centering inside the circle -->
                        <text class="tree-root-text" text-anchor="middle" dominant-baseline="middle" fill="#00FFFF" font-size="${rootFontSize}" font-weight="bold" style="pointer-events:none; font-family: 'Space Mono', monospace;">
                            <tspan x="0" dy="-0.4em">ELIJAH</tspan>
                            <tspan x="0" dy="1.2em">G&T</tspan>
                        </text>
                    </g>

                    ${treeData.map((d, i) => {
                        const rWidth = d.label.length * charWidth + 10;
                        const rX = d.anchor === 'end' ? d.dx - rWidth : (d.anchor === 'start' ? d.dx : d.dx - rWidth/2);
                        return `
                        <g id="node-group-${i}" transform="translate(${d.x}, ${d.y})">
                            <circle id="ring-${i}" class="pulse-ring" r="${nodeRadius}" style="animation-delay: ${i * 0.3}s" />
                            <circle id="node-${i}" class="tree-node" r="${nodeRadius}" fill="rgba(0, 255, 255, 0.1)" stroke="#00FFFF" stroke-width="2.5" />
                            <rect class="tree-label" x="${rX}" y="${(d.dy || 0) - 12}" width="${rWidth}" height="20" fill="#060d1f" opacity="0.7" rx="4" id="rect-${i}" />
                            <text id="label-${i}" class="tree-label" x="${d.dx || 0}" y="${d.dy || 5}" text-anchor="${d.anchor}">${d.label}</text>
                        </g>
                        `;
                    }).join('')}
                </g>
            </svg>`;
        container.innerHTML = svgContent;
        container.classList.add('active');
    };

    const animateGrowth = async () => {
        // 1. Root Pop
        const root = document.getElementById('root-group');
        root.style.transform = "translate(400, 420) scale(0)";
        await new Promise(r => setTimeout(r, 100));
        root.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        root.style.transform = "translate(400, 420) scale(1)";

        // 2. Branch Drawing
        for (let i = 0; i < treeData.length; i++) {
            const path = document.getElementById(`branch-${i}`);
            const len = path.getTotalLength();
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
            
            setTimeout(() => {
                path.style.transition = "stroke-dashoffset 0.5s ease-out";
                path.style.strokeDashoffset = "0";
                
                // 3. Node Pop
                setTimeout(() => {
                    document.getElementById(`node-${i}`).classList.add('pop');
                    // 4. Label Slide
                    setTimeout(() => {
                        document.getElementById(`rect-${i}`).classList.add('show');
                        document.getElementById(`label-${i}`).classList.add('show');
                    }, 200);
                }, 400);
            }, i * 150);
        }

        // Start pulse cycle once full
        setTimeout(startPulseCycle, 2000);
    };

    const startPulseCycle = () => {
        // Enable "electricity"
        treeData.forEach((_, i) => document.getElementById(`flow-${i}`).style.display = "block");

        cycleInterval = setInterval(() => {
            // Clear previous
            document.querySelectorAll('.tree-branch').forEach(b => b.classList.remove('active'));

            // Set active
            document.getElementById(`branch-${activeBranchIdx}`).classList.add('active');

            activeBranchIdx = (activeBranchIdx + 1) % treeData.length;
            
            // After one full rotation or specific time, trigger retraction
            if (activeBranchIdx === 0) {
                clearInterval(cycleInterval);
                setTimeout(retractTree, 1500);
            }
        }, 600);
    };

    const retractTree = async () => {
        document.querySelectorAll('rect.tree-label').forEach(r => r.classList.remove('show'));
        document.querySelectorAll('.tree-label').forEach(l => l.classList.remove('show'));
        document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('pop'));
        document.querySelectorAll('.electricity').forEach(e => e.style.display = "none");

        await new Promise(r => setTimeout(r, 400));

        treeData.forEach((_, i) => {
            const path = document.getElementById(`branch-${i}`);
            path.style.strokeDashoffset = path.getTotalLength();
        });

        setTimeout(() => {
            document.getElementById('root-group').style.transform = "translate(400, 420) scale(0)";
            setTimeout(initSequence, 1000);
        }, 600);
    };

    const initSequence = () => {
        activeBranchIdx = 0;
        buildTree();
        animateGrowth();
    };

    injectStyles();
    initSequence();
};

initMotionLab();

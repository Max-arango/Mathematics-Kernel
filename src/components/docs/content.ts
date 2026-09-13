// Bilingual manual content. Each block carries English + Spanish; formulas and
// code are language-neutral. Kept as data so one renderer serves both languages.
export type Lang = "en" | "es";

export type Block =
  | { t: "p"; en: string; es: string }
  | { t: "h"; en: string; es: string }
  | { t: "math"; text: string }
  | { t: "code"; text: string }
  | { t: "ul"; en: string[]; es: string[] };

export interface Section { id: string; title: { en: string; es: string }; blocks: Block[] }

const p = (en: string, es: string): Block => ({ t: "p", en, es });
const h = (en: string, es: string): Block => ({ t: "h", en, es });
const math = (text: string): Block => ({ t: "math", text });
const code = (text: string): Block => ({ t: "code", text });
const ul = (en: string[], es: string[]): Block => ({ t: "ul", en, es });

export const SECTIONS: Section[] = [
  {
    id: "overview",
    title: { en: "Overview", es: "Visión general" },
    blocks: [
      p(
        "MATH·LAB is a single mathematical engine with four workspaces sharing one parser, AST, complex numbers and numeric core: a Desmos-style 2D/3D graphing calculator, a GPU fractal laboratory, and a Bloch-sphere qubit simulator.",
        "MATH·LAB es un único motor matemático con cuatro espacios que comparten un solo parser, AST, números complejos y núcleo numérico: una calculadora gráfica 2D/3D tipo Desmos, un laboratorio de fractales en GPU y un simulador de qubit en la esfera de Bloch.",
      ),
      p(
        "Switch workspace from the top tabs: Calculator, Fractal Lab, Bloch Sphere, Docs.",
        "Cambia de espacio con las pestañas superiores: Calculator, Fractal Lab, Bloch Sphere, Docs.",
      ),
      h("Expression engine", "Motor de expresiones"),
      p(
        "Everything you type is tokenized (lexer) → parsed into an Abstract Syntax Tree (AST) → evaluated numerically or compiled to GLSL. JavaScript eval / new Function are never used: only whitelisted functions run.",
        "Todo lo que escribes se tokeniza (lexer) → se parsea a un Árbol de Sintaxis Abstracta (AST) → se evalúa numéricamente o se compila a GLSL. Nunca se usa eval / new Function de JavaScript: solo corren funciones en lista blanca.",
      ),
      ul(
        ["Operators: + − * / ^ , unary −, implicit product (2x, x(x+1))", "Functions: sin cos tan asin acos atan sinh cosh tanh sec csc cot exp ln log sqrt cbrt abs floor ceil round sign min max mod pow", "Constants: π (pi), e, φ (phi), τ (tau)"],
        ["Operadores: + − * / ^ , menos unario, producto implícito (2x, x(x+1))", "Funciones: sin cos tan asin acos atan sinh cosh tanh sec csc cot exp ln log sqrt cbrt abs floor ceil round sign min max mod pow", "Constantes: π (pi), e, φ (phi), τ (tau)"],
      ),
    ],
  },
  {
    id: "calc2d",
    title: { en: "2D Calculator", es: "Calculadora 2D" },
    blocks: [
      p(
        "Plot y = f(x). Add several expressions; each has a color and a visibility toggle. Drag to pan, wheel to zoom on the cursor.",
        "Grafica y = f(x). Añade varias expresiones; cada una tiene color y visibilidad. Arrastra para desplazar, rueda para hacer zoom en el cursor.",
      ),
      h("Definitions & references", "Definiciones y referencias"),
      code("f(x) = x^2\ng(x) = sin(x)\nh(x) = f(x) + g(x)"),
      p(
        "Functions can reference each other. y = expr and a bare expr both plot against x.",
        "Las funciones pueden referenciarse entre sí. y = expr y una expresión suelta grafican contra x.",
      ),
      h("Sliders", "Sliders"),
      p(
        "Any undefined variable becomes a slider. A numeric assignment (a = 2) is a slider too. Open ⚙ to set min / max / step — these accept expressions, so a slider can be restricted to a set, e.g. min 0, max n−1, step 2 gives {0, 2, 4, …, n−1}. ▶ animates a slider (speed + loop / ping-pong).",
        "Cualquier variable no definida se vuelve slider. Una asignación numérica (a = 2) también es slider. Abre ⚙ para fijar min / max / step — aceptan expresiones, así un slider se limita a un conjunto, p. ej. min 0, max n−1, step 2 da {0, 2, 4, …, n−1}. ▶ anima un slider (velocidad + loop / ping-pong).",
      ),
      h("Analysis tools", "Herramientas de análisis"),
      ul(
        ["Locate: draggable point on the x-axis with f(x) readout.", "Derivative: tangent line at x=a; shows f'(a) numeric and the symbolic derivative.", "Integral: shaded area between a and b; value by Simpson's rule."],
        ["Locate: punto arrastrable en el eje x con lectura de f(x).", "Derivative: recta tangente en x=a; muestra f'(a) numérica y la derivada simbólica.", "Integral: área sombreada entre a y b; valor por regla de Simpson."],
      ),
      h("The math", "La matemática"),
      p("Symbolic differentiation rules applied over the AST:", "Reglas de derivación simbólica aplicadas sobre el AST:"),
      math(String.raw`\begin{aligned}
(f+g)' &= f' + g' \\[2pt]
(fg)' &= f'g + fg' \\[2pt]
\left(\tfrac{f}{g}\right)' &= \frac{f'g - fg'}{g^{2}} \\[2pt]
\big(f(u)\big)' &= f'(u)\,u' \quad\text{(chain rule)} \\[2pt]
(x^{n})' &= n\,x^{n-1}
\end{aligned}`),
      p("Definite integral by composite Simpson's rule (n even):", "Integral definida por regla de Simpson compuesta (n par):"),
      math(String.raw`\int_{a}^{b} f\,dx \;\approx\; \frac{h}{3}\Big[\, f_{0} + 4\!\sum f_{\text{odd}} + 2\!\sum f_{\text{even}} + f_{n} \,\Big],\qquad h=\frac{b-a}{n}`),
    ],
  },
  {
    id: "calc3d",
    title: { en: "3D Calculator", es: "Calculadora 3D" },
    blocks: [
      p(
        "Two kinds of object. Explicit height surfaces z = f(x, y), and implicit surfaces F(x, y, z) = 0 where z is a genuine coordinate.",
        "Dos tipos de objeto. Superficies de altura explícitas z = f(x, y), y superficies implícitas F(x, y, z) = 0 donde z es una coordenada real.",
      ),
      code("z = sin(x)*cos(y)          → height surface\nx^2 + y^2 + z^2 = 9        → sphere (implicit)\nz^2 - x^2 - y^2 = 1        → hyperboloid"),
      p(
        "Add several expressions to see multiple surfaces at once, each tinted by its color. x and y are the plot axes; z is the output/height axis and is never turned into a slider.",
        "Añade varias expresiones para ver varias superficies a la vez, teñidas por su color. x, y son los ejes del plano; z es el eje de salida/altura y nunca se convierte en slider.",
      ),
      h("Reference frame", "Marco de referencia"),
      ul(
        ["Bounding box, ground grid (1 unit), colored X/Y/Z axes with projected number labels.", "z ∈ ±N control sets the vertical extent (axis, box and surface clamp).", "View presets: Iso / Top / Front / Side; drag to orbit, wheel to zoom.", "Probe point (x, y): shows f(x,y), ∂f/∂x, ∂f/∂y and ‖∇f‖."],
        ["Caja delimitadora, grid del piso (1 unidad), ejes X/Y/Z de color con números proyectados.", "Control z ∈ ±N fija la extensión vertical (eje, caja y recorte de la superficie).", "Vistas: Iso / Top / Front / Side; arrastra para orbitar, rueda para zoom.", "Sonda (x, y): muestra f(x,y), ∂f/∂x, ∂f/∂y y ‖∇f‖."],
      ),
      h("The math", "La matemática"),
      p("Gradient of a surface (used by the probe):", "Gradiente de una superficie (lo usa la sonda):"),
      math(String.raw`\nabla f = \left( \frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y} \right)`),
      p(
        "Explicit surfaces are a regular grid mesh with normals from central differences. Implicit surfaces are extracted with marching tetrahedra: the volume is sampled, each cube split into 6 tetrahedra, and the g = 0 crossing is triangulated. Normals come from the numerical gradient ∇g.",
        "Las superficies explícitas son una malla regular con normales por diferencias centrales. Las implícitas se extraen con marching tetrahedra: se muestrea el volumen, cada cubo se parte en 6 tetraedros y se triangula el cruce g = 0. Las normales vienen del gradiente numérico ∇g.",
      ),
    ],
  },
  {
    id: "fractal",
    title: { en: "Fractal Lab", es: "Laboratorio Fractal" },
    blocks: [
      p(
        "GPU escape-time fractals. For each pixel we iterate a complex map and color by how fast the orbit escapes.",
        "Fractales de tiempo de escape en GPU. Para cada píxel se itera un mapa complejo y se colorea según qué tan rápido escapa la órbita.",
      ),
      math(String.raw`z_{n+1} = z_{n}^{\,p} + c,\qquad \text{escape when } |z_{n}| > R`),
      p("A complex power uses polar form:", "La potencia compleja usa forma polar:"),
      math(String.raw`z = r\,e^{i\theta} \quad\Longrightarrow\quad z^{p} = r^{p}\,e^{i p \theta}`),
      h("Built-in families", "Familias incluidas"),
      ul(
        ["Mandelbrot: z₀ = 0, c = pixel.", "Julia: c fixed, z₀ = pixel. Click a Mandelbrot point to spawn its Julia.", "Burning Ship: z = (|Re z| + i|Im z|)ᵖ + c.", "Tricorn: z = conj(z)ᵖ + c.  Celtic: |Re(zᵖ)| + i·Im(zᵖ) + c.  Buffalo: |Re| + i|Im| of zᵖ.", "Newton: z_{n+1} = z_n − f/f' with f = zⁿ − 1, colored by which root it converges to."],
        ["Mandelbrot: z₀ = 0, c = píxel.", "Julia: c fijo, z₀ = píxel. Haz clic en un punto de Mandelbrot para generar su Julia.", "Burning Ship: z = (|Re z| + i|Im z|)ᵖ + c.", "Tricorn: z = conj(z)ᵖ + c.  Celtic: |Re(zᵖ)| + i·Im(zᵖ) + c.  Buffalo: |Re| + i|Im| de zᵖ.", "Newton: z_{n+1} = z_n − f/f' con f = zⁿ − 1, coloreado por la raíz a la que converge."],
      ),
      h("Smooth coloring", "Coloreado suave"),
      p("Continuous iteration count removes color banding:", "El conteo continuo de iteraciones elimina las bandas de color:"),
      math(String.raw`\nu = n + 1 - \frac{\log\big(\log|z_{n}|\big)}{\log p}`),
      h("Deep zoom (df64)", "Zoom profundo (df64)"),
      p(
        "WebGL floats are 32-bit (~7 digits). Coordinates and the iteration run in emulated double precision (double-single: each number is a hi + lo pair of float32), extending crisp zoom to ~1e-12 for integer exponents.",
        "Los floats de WebGL son de 32 bits (~7 dígitos). Las coordenadas y la iteración corren en doble precisión emulada (double-single: cada número es un par hi + lo de float32), extendiendo el zoom nítido a ~1e-12 para exponentes enteros.",
      ),
      h("Custom expressions → fractal", "Expresiones propias → fractal"),
      p(
        "Custom f(z,c) compiles your typed expression through the SAME parser into a GPU shader: z^2 + c, sin(z) + c, z^2 + conjugate(c), exp(z) + c, z^p + c (p = exponent slider). Complex f(z) renders domain coloring: hue = arg f(z), brightness = |f(z)|. The sidebar shows the symbolic ∂/∂z of your expression.",
        "Custom f(z,c) compila tu expresión con el MISMO parser a un shader de GPU: z^2 + c, sin(z) + c, z^2 + conjugate(c), exp(z) + c, z^p + c (p = slider de exponente). Complex f(z) hace domain coloring: matiz = arg f(z), brillo = |f(z)|. La barra lateral muestra la ∂/∂z simbólica de tu expresión.",
      ),
      p(
        "Palettes, color density/offset/invert, per-parameter animation, and PNG / config JSON export are available for every fractal.",
        "Paletas, densidad/desfase/invertir color, animación por parámetro y exportar PNG / config JSON están disponibles para cada fractal.",
      ),
    ],
  },
  {
    id: "bloch-state",
    title: { en: "Bloch — states", es: "Bloch — estados" },
    blocks: [
      p("A qubit is a normalized complex 2-vector:", "Un qubit es un 2-vector complejo normalizado:"),
      math(String.raw`|\psi\rangle = \alpha|0\rangle + \beta|1\rangle,\qquad |\alpha|^{2} + |\beta|^{2} = 1`),
      p("Written with angles θ (polar) and φ (azimuth):", "Escrito con ángulos θ (polar) y φ (azimutal):"),
      math(String.raw`|\psi\rangle = \cos\tfrac{\theta}{2}\,|0\rangle + e^{i\phi}\sin\tfrac{\theta}{2}\,|1\rangle`),
      p("The Bloch vector (the arrow on the sphere):", "El vector de Bloch (la flecha en la esfera):"),
      math(String.raw`\begin{aligned}
x &= 2\,\operatorname{Re}(\bar\alpha\beta) = \sin\theta\cos\phi \\[2pt]
y &= 2\,\operatorname{Im}(\bar\alpha\beta) = \sin\theta\sin\phi \\[2pt]
z &= |\alpha|^{2} - |\beta|^{2} = \cos\theta
\end{aligned}`),
      p(
        "|0⟩ is the north pole (+z), |1⟩ the south pole (−z), |+⟩/|−⟩ sit on ±x, |i⟩/|−i⟩ on ±y. Set-state buttons jump to these. The gold arrow is the current spin; the fading teal trail is its history (toggle it off if it clutters).",
        "|0⟩ es el polo norte (+z), |1⟩ el polo sur (−z), |+⟩/|−⟩ están en ±x, |i⟩/|−i⟩ en ±y. Los botones de estado saltan a estos. La flecha dorada es el spin actual; la estela teal que se desvanece es su historia (ocúltala si estorba).",
      ),
    ],
  },
  {
    id: "bloch-gates",
    title: { en: "Bloch — gates & rotations", es: "Bloch — compuertas y rotaciones" },
    blocks: [
      p("Gates are 2×2 unitary matrices acting on (α, β):", "Las compuertas son matrices unitarias 2×2 que actúan sobre (α, β):"),
      math(String.raw`X = \begin{pmatrix}0&1\\1&0\end{pmatrix}\quad Y = \begin{pmatrix}0&-i\\ i&0\end{pmatrix}\quad Z = \begin{pmatrix}1&0\\0&-1\end{pmatrix}`),
      math(String.raw`H = \tfrac{1}{\sqrt{2}}\begin{pmatrix}1&1\\1&-1\end{pmatrix}\quad S = \begin{pmatrix}1&0\\0&i\end{pmatrix}\quad T = \begin{pmatrix}1&0\\0&e^{i\pi/4}\end{pmatrix}`),
      p(
        "Every single-qubit gate is a rotation of the Bloch vector about an axis n by an angle:",
        "Toda compuerta de un qubit es una rotación del vector de Bloch alrededor de un eje n por un ángulo:",
      ),
      math(String.raw`R_{\hat{n}}(\theta) = \cos\tfrac{\theta}{2}\,I \;-\; i\,\sin\tfrac{\theta}{2}\,(\hat{n}\cdot\vec{\sigma})`),
      p("where σ = (X, Y, Z) are the Pauli matrices. As axis / angle:", "donde σ = (X, Y, Z) son las matrices de Pauli. Como eje / ángulo:"),
      ul(
        ["X, Y, Z = π rotation about x, y, z.", "H = π rotation about (x+z)/√2.", "S = π/2 about z,  T = π/4 about z (S†, T† negative).", "Rx / Ry / Rz: rotate by the chosen angle about x / y / z."],
        ["X, Y, Z = rotación de π sobre x, y, z.", "H = rotación de π sobre (x+z)/√2.", "S = π/2 sobre z,  T = π/4 sobre z (S†, T† negativos).", "Rx / Ry / Rz: rota el ángulo elegido sobre x / y / z."],
      ),
      p(
        "This axis/angle view is why any gate can be animated as an arc on the sphere — the arrow walks the rotation.",
        "Esta vista eje/ángulo es la razón por la que cualquier compuerta se anima como un arco en la esfera — la flecha recorre la rotación.",
      ),
    ],
  },
  {
    id: "bloch-pulses",
    title: { en: "Bloch — pulses", es: "Bloch — pulsos" },
    blocks: [
      p(
        "A drive pulse evolves the qubit under a Hamiltonian instead of a discrete gate — the physical way rotations happen (NMR / superconducting qubits).",
        "Un pulso de excitación evoluciona el qubit bajo un Hamiltoniano en vez de una compuerta discreta — la forma física en que ocurren las rotaciones (RMN / qubits superconductores).",
      ),
      math(String.raw`H = \frac{\Delta}{2}\,\sigma_{z} \;+\; \frac{\Omega}{2}\big(\cos\phi\,\sigma_{x} + \sin\phi\,\sigma_{y}\big)`),
      ul(
        ["Ω — Rabi frequency (drive amplitude).", "Δ — detuning (how far off resonance).", "φ — pulse phase (0° drives about x, 90° about y).", "t — duration."],
        ["Ω — frecuencia de Rabi (amplitud del drive).", "Δ — detuning (qué tan fuera de resonancia).", "φ — fase del pulso (0° excita sobre x, 90° sobre y).", "t — duración."],
      ),
      p("Evolving for time t is a rotation about the effective axis:", "Evolucionar un tiempo t es una rotación sobre el eje efectivo:"),
      math(String.raw`\begin{aligned}
\text{axis} &\;\propto\; (\,\Omega\cos\phi,\ \Omega\sin\phi,\ \Delta\,) \\[2pt]
\text{angle} &\;=\; \sqrt{\Omega^{2} + \Delta^{2}}\;\cdot\; t
\end{aligned}`),
      p(
        "On resonance (Δ = 0) the axis lies in the equatorial plane and a pulse with Ω·t = π is a π-pulse (a full flip |0⟩ → |1⟩). Detuning tilts the axis toward z and speeds the rotation to Ω_eff = √(Ω²+Δ²), producing the characteristic off-resonance cones/spirals.",
        "En resonancia (Δ = 0) el eje está en el plano ecuatorial y un pulso con Ω·t = π es un π-pulso (volteo completo |0⟩ → |1⟩). El detuning inclina el eje hacia z y acelera la rotación a Ω_eff = √(Ω²+Δ²), produciendo los conos/espirales característicos fuera de resonancia.",
      ),
      p(
        "Move any pulse slider and the sphere shows a live cyan preview: the effective rotation axis plus a ghost arc from the current state to where the pulse would land — before you Apply. Buttons Apply / π pulse / π/2 commit it and animate the arrow.",
        "Mueve cualquier slider del pulso y la esfera muestra un preview cyan en vivo: el eje de rotación efectivo más un arco fantasma desde el estado actual hasta dónde caería el pulso — antes de Apply. Los botones Apply / π pulse / π/2 lo confirman y animan la flecha.",
      ),
    ],
  },
  {
    id: "fourd",
    title: { en: "4D Space", es: "Espacio 4D" },
    blocks: [
      p(
        "You cannot draw 4D directly. The pipeline is: rotate in 4-space → project 4D → 3D → view with the 3D camera. The fourth coordinate w is mapped to color, so position shows three dimensions and hue shows the fourth.",
        "No se puede dibujar 4D directo. El proceso es: rotar en 4-espacio → proyectar 4D → 3D → ver con la cámara 3D. La cuarta coordenada w se mapea a color, así la posición muestra tres dimensiones y el matiz la cuarta.",
      ),
      h("Rotation", "Rotación"),
      p(
        "In 4D you rotate in a plane, not about an axis. There are six independent planes (XY, XZ, XW, YZ, YW, ZW). A rotation in plane (i, j) by θ:",
        "En 4D rotas en un plano, no alrededor de un eje. Hay seis planos independientes (XY, XZ, XW, YZ, YW, ZW). Una rotación en el plano (i, j) por θ:",
      ),
      math(String.raw`\begin{pmatrix} x_i' \\ x_j' \end{pmatrix} = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix} \begin{pmatrix} x_i \\ x_j \end{pmatrix}`),
      h("Perspective projection", "Proyección en perspectiva"),
      p("From a viewer at distance d along +w, each point scales by d/(d−w):", "Desde un visor a distancia d sobre +w, cada punto escala por d/(d−w):"),
      math(String.raw`(x, y, z) \;\mapsto\; \frac{d}{\,d - w\,}\,(x, y, z)`),
      p(
        "Points with larger w loom larger — the inner cube of the tesseract grows to the outer cube as it rotates.",
        "Los puntos con w mayor se agrandan — el cubo interno del teseracto crece hasta el externo al rotar.",
      ),
      h("What you can plot", "Qué puedes graficar"),
      ul(
        ["Polytopes: tesseract (8-cell), 5-cell (simplex), 16-cell.", "Parametric surfaces (u, v) → ℝ⁴ typed with the shared parser, e.g. the Clifford torus x=cos u, y=sin u, z=cos v, w=sin v (which lives on the unit 3-sphere).", "Six rotation-plane sliders, projection distance, and an auto double-rotation (XW + YZ)."],
        ["Politopos: teseracto (8-cell), 5-cell (símplex), 16-cell.", "Superficies paramétricas (u, v) → ℝ⁴ escritas con el parser compartido, p. ej. el toro de Clifford x=cos u, y=sin u, z=cos v, w=sin v (que vive en la 3-esfera unidad).", "Seis sliders de plano de rotación, distancia de proyección y una doble rotación automática (XW + YZ)."],
      ),
    ],
  },
  {
    id: "topology",
    title: { en: "Topology", es: "Topología" },
    blocks: [
      p(
        "The topology workspace shows triangulated CLOSED 2-manifolds (surfaces with no boundary, like a sphere or a donut) and lets you continuously deform one into another. Each object is a parametric surface sampled on a (u, v) grid and welded at its seams and poles.",
        "El espacio de topología muestra 2-variedades CERRADAS trianguladas (superficies sin borde, como una esfera o una dona) y permite deformar una en otra de forma continua. Cada objeto es una superficie paramétrica muestreada en una malla (u, v) y soldada en sus costuras y polos.",
      ),
      h("Homeomorphism", "Homeomorfismo"),
      p(
        "Two spaces are homeomorphic when there is a bijection f that is continuous and whose inverse is also continuous. Continuity is the GENERAL topological definition: the preimage of every open set is open — not an epsilon-delta test.",
        "Dos espacios son homeomorfos cuando existe una biyección f continua cuya inversa también es continua. La continuidad es la definición topológica GENERAL: la preimagen de todo abierto es abierta — no un test épsilon-delta.",
      ),
      h("Exact vs numeric verification", "Verificación exacta vs numérica"),
      p(
        "For FINITE spaces the app verifies homeomorphism EXACTLY and exhaustively (finiteSpace.ts): it checks bijectivity and that the preimage of every open set is open, with no floating point. For the SURFACES, it uses the classification theorem: two closed, connected, orientable surfaces are homeomorphic iff they share the same Euler characteristic χ, which is COMPUTED from the mesh (V − E + F) rather than declared.",
        "Para espacios FINITOS la app verifica el homeomorfismo de forma EXACTA y exhaustiva (finiteSpace.ts): comprueba biyectividad y que la preimagen de todo abierto sea abierta, sin coma flotante. Para las SUPERFICIES usa el teorema de clasificación: dos superficies cerradas, conexas y orientables son homeomorfas sii comparten la misma característica de Euler χ, que se CALCULA de la malla (V − E + F) en vez de declararse.",
      ),
      math(String.raw`\chi = V - E + F, \qquad g = \frac{2 - \chi}{2}`),
      h("The morph is a visualization", "El morph es una visualización"),
      p(
        "The animated deformation (morph slider) is a visual homotopy/isotopy — it illustrates the equivalence but is NOT the proof. The proof is the equality of the computed invariants shown in the panel.",
        "La deformación animada (slider de morph) es una homotopía/isotopía visual — ilustra la equivalencia pero NO es la demostración. La demostración es la igualdad de los invariantes calculados que se muestran en el panel.",
      ),
      h("Limitation", "Limitación"),
      p(
        "General continuous-map homeomorphism on ℝⁿ (e.g. showing x ↦ x³ is a homeomorphism of ℝ) is NOT verified here — that is undecidable in general without symbolic analysis. Only finite spaces (exact) and closed orientable surfaces (via χ) are decided.",
        "El homeomorfismo por mapa continuo general en ℝⁿ (p. ej. mostrar que x ↦ x³ es un homeomorfismo de ℝ) NO se verifica aquí — es indecidible en general sin análisis simbólico. Solo se deciden espacios finitos (exacto) y superficies cerradas orientables (vía χ).",
      ),
    ],
  },
  {
    id: "notebook",
    title: { en: "Notebook / Experiments", es: "Notebook / Experimentos" },
    blocks: [
      p(
        "The Notebook turns exploration into a reproducible document. An experiment is a sequence of cells — text, parameters, expressions, and analyses — whose outputs are derived deterministically from the cell source. Save it, reload it, and it reconstructs exactly.",
        "El Notebook convierte la exploración en un documento reproducible. Un experimento es una secuencia de celdas — texto, parámetros, expresiones y análisis — cuyos resultados se derivan de forma determinista del texto de la celda. Guárdalo, recárgalo, y se reconstruye idéntico.",
      ),
      ul(
        ["Expression cells define named objects (e.g. f = a·x² − 4). Analysis cells inspect them (derivatives, roots, critical points, gradient/Hessian).", "Parameters propagate through a dependency graph: change a and every downstream analysis recomputes.", "Undo/redo (slider drags coalesced), snapshots, localStorage autosave, and import/export as .mathsim.json.", "Bundled example experiments double as regression fixtures."],
        ["Las celdas de expresión definen objetos con nombre (p. ej. f = a·x² − 4). Las de análisis los inspeccionan (derivadas, raíces, puntos críticos, gradiente/Hessiano).", "Los parámetros propagan por un grafo de dependencias: cambia a y todo análisis aguas abajo se recalcula.", "Undo/redo (arrastres de slider agrupados), snapshots, autoguardado en localStorage e import/export como .mathsim.json.", "Los experimentos de ejemplo sirven también de fixtures de regresión."],
      ),
      h("Reproducible & safe", "Reproducible y seguro"),
      p(
        "The canonical data is the source, never rendered output; caches can be discarded and regenerated. Experiment files are untrusted input: parsed as declarative JSON, schema-validated with resource limits, with no eval / new Function — malformed files fail with structured errors instead of crashing or executing anything.",
        "El dato canónico es el texto fuente, nunca el resultado renderizado; los cachés se pueden descartar y regenerar. Los archivos de experimento son input no confiable: se parsean como JSON declarativo, se validan contra esquema con límites de recursos, sin eval / new Function — los archivos malformados fallan con errores estructurados en vez de crashear o ejecutar nada.",
      ),
    ],
  },
  {
    id: "inspector",
    title: { en: "Inspector", es: "Inspector" },
    blocks: [
      p(
        "The Inspector is a microscope for mathematical objects. Pick an object — an expression, a matrix, a vector, or a topological surface — and it reports its structure, properties, calculus, and invariants, with each value tagged by how it was obtained.",
        "El Inspector es un microscopio para objetos matemáticos. Elige un objeto — una expresión, una matriz, un vector o una superficie topológica — y reporta su estructura, propiedades, cálculo e invariantes, con cada valor etiquetado según cómo se obtuvo.",
      ),
      ul(
        ["Expression: AST structure, polynomial degree, conservative domain restrictions, f′/f″, gradient/Hessian/Laplacian, numeric roots and critical points classified by f″.", "Matrix: determinant, rank, invertibility, symmetry, and the 2×2 geometric action; related transpose/inverse.", "Vector: norm and unit direction. Topology: V, E, F, χ, components, orientability and genus computed from the mesh.", "Compare mode, capability chips, navigable related objects, and an assumptions/limits list."],
        ["Expresión: estructura del AST, grado polinómico, restricciones de dominio conservadoras, f′/f″, gradiente/Hessiano/Laplaciano, raíces numéricas y puntos críticos clasificados por f″.", "Matriz: determinante, rango, invertibilidad, simetría y acción geométrica 2×2; transpuesta/inversa relacionadas.", "Vector: norma y dirección unitaria. Topología: V, E, F, χ, componentes, orientabilidad y género calculados de la malla.", "Modo comparar, chips de capacidad, objetos relacionados navegables y lista de supuestos/límites."],
      ),
      h("Confidence labels", "Etiquetas de confianza"),
      p(
        "Every value declares its epistemic status: exact (integers/closed form), symbolic, numerical, estimated (sampled), inferred (under stated assumptions), heuristic, or unsupported. A numerical estimate is never shown as a proof; symbolic equivalence is never claimed from numerical sampling alone.",
        "Cada valor declara su estatus: exact (enteros/forma cerrada), symbolic, numerical, estimated (muestreado), inferred (bajo supuestos declarados), heuristic o unsupported. Una estimación numérica nunca se muestra como prueba; nunca se afirma equivalencia simbólica solo por muestreo numérico.",
      ),
    ],
  },
  // ─── PHASE IV — LINEAR ALGEBRA ───────────────────────────────────────────────
  {
    id: "linear-algebra",
    title: { en: "Linear Algebra", es: "Álgebra lineal" },
    blocks: [
      p(
        "Phase IV extends the matrix foundation into a serious linear algebra subsystem: vector spaces, linear maps, subspaces, bases, rank, nullspace, column/row spaces, and geometric visualization of 2D/3D linear maps.",
        "La Fase IV extiende la base matricial en un subsistema serio de álgebra lineal: espacios vectoriales, aplicaciones lineales, subespacios, bases, rango, nucleo, espacios columna/fila, y visualización geométrica de aplicaciones lineales 2D/3D.",
      ),
      h("Matrix decompositions", "Descomposiciones matriciales"),
      ul(
        ["LU with partial pivoting: PA = LU for square matrices; solves linear systems and gives the determinant.", "QR (Householder): A = QR with orthonormal Q and upper-triangular R; stable least squares via back-substitution.", "Cholesky: A = LLᵀ for symmetric positive-definite matrices; half the work of LU.", "SVD: A = UΣVᵀ for any m×n matrix; singular values reveal rank, condition number κ = σ_max/σ_min, and the best low-rank approximation."],
        ["LU con pivoteo parcial: PA = LU para matrices cuadradas; resuelve sistemas lineales y da el determinante.", "QR (Householder): A = QR con Q ortonormal y R triangular superior; mínimos cuadrados estables por sustitución hacia atrás.", "Cholesky: A = LLᵀ para matrices simétricas definidas positivas; la mitad del trabajo de LU.", "SVD: A = UΣVᵀ para cualquier matriz m×n; los valores singulares revelan rango, número de condición κ = σ_max/σ_min, y la mejor aproximación de bajo rango."],
      ),
      h("Eigenvalues & eigenvectors", "Autovalores y autovectores"),
      p(
        "The general eigenvalue problem Av = λv is solved by the QR algorithm with implicit shifts (handles complex/defective eigenvalues). For symmetric matrices the Jacobi method gives real eigenvalues and orthogonal eigenvectors. The inspector reports algebraic/geometric multiplicities and diagonalizability.",
        "El problema general de autovalores Av = λv se resuelve por el algoritmo QR con desplazamientos implícitos (maneja autovalores complejos/defectuosos). Para matrices simétricas el método de Jacobi da autovalores reales y autovectores ortogonales. El inspector reporta multiplicidades algebraica/geométrica y diagonalizabilidad.",
      ),
      h("Least squares", "Mínimos cuadrados"),
      p(
        "min_x ‖Ax − b‖₂ is solved by QR (full rank) or SVD (rank-deficient). The inspector exposes the solution, residual norm, rank, and condition number.",
        "min_x ‖Ax − b‖₂ se resuelve por QR (rango completo) o SVD (rango deficiente). El inspector expone la solución, norma del residuo, rango, y número de condición.",
      ),
      h("Change of basis", "Cambio de base"),
      p(
        "Coordinates [v]_B relative to a custom basis B are computed via the change-of-basis matrix. Visualization shows the standard basis, custom basis, and the coordinate transformation.",
        "Coordenadas [v]_B relativas a una base personalizada B se calculan vía la matriz de cambio de base. La visualización muestra la base estándar, la base personalizada, y la transformación de coordenadas.",
      ),
    ],
  },
  // ─── PHASE IV — OPTIMIZATION ─────────────────────────────────────────────────
  {
    id: "optimization",
    title: { en: "Optimization", es: "Optimización" },
    blocks: [
      p(
        "A general optimization subsystem for local minimization: univariate (golden-section) and multivariate (gradient descent, damped Newton with backtracking line search). Every result exposes the solution, objective value, iterations, trajectory, gradient norm, and termination reason. No global-optimization claims are made.",
        "Un subsistema de optimización general para minimización local: univariante (sección áurea) y multivariante (descenso de gradiente, Newton amortiguado con búsqueda de línea backtracking). Todo resultado expone la solución, valor objetivo, iteraciones, trayectoria, norma del gradiente, y razón de terminación. No se hacen afirmaciones de optimización global.",
      ),
      h("Univariate: golden-section", "Univariante: sección áurea"),
      p(
        "Derivative-free minimization of f on a bracket [a,b] assuming unimodality. Order φ⁻ⁿ convergence. The inspector classifies the critical point via f''.",
        "Minimización libre de derivada de f en un intervalo [a,b] asumiendo unimodalidad. Convergencia orden φ⁻ⁿ. El inspector clasifica el punto crítico vía f''.",
      ),
      h("Multivariate: gradient descent & Newton", "Multivariante: descenso de gradiente y Newton"),
      ul(
        ["Gradient descent: steepest direction with Armijo backtracking; linear convergence, may stall on ill-conditioned problems.", "Newton: solves H·d = −∇f each step, falls back to gradient step when H is singular/indefinite; quadratic convergence near a non-degenerate minimum.", "Hessian classification: the inspector evaluates the Hessian at critical points and classifies them as minimum/maximum/saddle via eigenvalue signs."],
        ["Descenso de gradiente: dirección más empinada con backtracking Armijo; convergencia lineal, puede estancarse en problemas mal condicionados.", "Newton: resuelve H·d = −∇f en cada paso, vuelve al paso de gradiente si H es singular/indefinido; convergencia cuadrática cerca de un mínimo no degenerado.", "Clasificación por Hessiano: el inspector evalúa el Hessiano en puntos críticos y los clasifica como mínimo/máximo/silla por los signos de los autovalores."],
      ),
      h("Visualization", "Visualización"),
      p(
        "For f(x,y): surface, contour map, gradient vectors, and optimization trajectory (starting point → minimum). The trajectory is a first-class visual object.",
        "Para f(x,y): superficie, mapa de contorno, vectores gradiente, y trayectoria de optimización (punto inicial → mínimo). La trayectoria es un objeto visual de primera clase.",
      ),
    ],
  },
  // ─── PHASE IV — DYNAMICAL SYSTEMS ────────────────────────────────────────────
  {
    id: "dynamical-systems",
    title: { en: "Dynamical Systems", es: "Sistemas dinámicos" },
    blocks: [
      p(
        "First-class dynamical systems: continuous flows ẋ = f(x) and discrete maps xₙ₊₁ = f(xₙ) with named state variables and parameters. The inspector rebuilds the system from its source expressions and reports structure, equilibria, linearized stability, and vector field.",
        "Sistemas dinámicos de primera clase: flujos continuos ẋ = f(x) y mapas discretos xₙ₊₁ = f(xₙ) con variables de estado y parámetros nombrados. El inspector reconstruye el sistema desde sus expresiones fuente y reporta estructura, equilibrios, estabilidad linealizada, y campo vectorial.",
      ),
      h("Equilibria", "Equilibrios"),
      p(
        "Equilibria satisfy f(x) = 0 (continuous) or f(x) = x (discrete). Found numerically by Newton from a seed grid; candidates are flagged as numerical, not proven. The inspector reports their coordinates and residuals.",
        "Los equilibrios satisfacen f(x) = 0 (continuo) o f(x) = x (discreto). Se encuentran numéricamente por Newton desde una grilla de semillas; los candidatos se marcan como numéricos, no probados. El inspector reporta sus coordenadas y residuos.",
      ),
      h("Stability (Hartman–Grobman)", "Estabilidad (Hartman–Grobman)"),
      p(
        "At each equilibrium the Jacobian J = ∂f/∂x is evaluated and its eigenvalues inspected. Continuous: Re(λ) < 0 ⇒ stable, > 0 ⇒ unstable, ±i ⇒ center (linear), mixed ⇒ saddle. Discrete: |λ| < 1 ⇒ stable, > 1 ⇒ unstable, = 1 ⇒ center. The inspector honestly flags linear centers as inconclusive for nonlinear stability.",
        "En cada equilibrio se evalúa el Jacobiano J = ∂f/∂x y se inspeccionan sus autovalores. Continuo: Re(λ) < 0 ⇒ estable, > 0 ⇒ inestable, ±i ⇒ centro (lineal), mixtos ⇒ silla. Discreto: |λ| < 1 ⇒ estable, > 1 ⇒ inestable, = 1 ⇒ centro. El inspector marca honestamente los centros lineales como inconclusivos para la estabilidad no lineal.",
      ),
      h("Phase space & nullclines", "Espacio de fases y nulinclinas"),
      p(
        "For 2D systems: vector field arrows, streamlines, multiple trajectories from different ICs, nullclines (f=0 and g=0 curves), and equilibrium overlays. This is a core visualization capability.",
        "Para sistemas 2D: flechas de campo vectorial, líneas de corriente, múltiples trayectorias desde CI distintas, nulinclinas (curvas f=0 y g=0), y superposición de equilibrios. Es una capacidad de visualización central.",
      ),
      h("Bifurcation & chaos", "Bifurcación y caos"),
      p(
        "Parameter sweeps (μ) show equilibria vs μ and stability vs μ. Classic examples: logistic map (period doubling → chaos), saddle-node, pitchfork. Chaos tools: Lyapunov exponent, sensitivity to ICs, orbit diagrams, Poincaré sections — all with deterministic seeds for reproducibility.",
        "Barridos de parámetros (μ) muestran equilibrios vs μ y estabilidad vs μ. Ejemplos clásicos: mapa logístico (duplicación de período → caos), silla-nudo, horquilla. Herramientas de caos: exponente de Lyapunov, sensibilidad a CI, diagramas de órbita, secciones de Poincaré — todos con semillas determinísticas para reproducibilidad.",
      ),
    ],
  },
  // ─── DYNAMICS 3D — SPACE-TIME DYNAMICS LABORATORY ────────────────────────────
  {
    id: "dynamics3d",
    title: { en: "Dynamics 3D", es: "Dinámica 3D" },
    blocks: [
      p(
        "One Model toggle switches among three independent physical models — Gravity (N-Body), Mathematical Field, General Relativity — sharing one camera, one render loop and one click-to-spawn preset picker. All physics runs in refs and steps inside the animation loop, never in React state; nothing here is a second engine — the same parser, AST and ODE solver that drive every other MATH·LAB workspace drive all three modes. No eval / new Function.",
        "Un solo interruptor de Modelo cambia entre tres modelos físicos independientes — Gravity (N-Body), Mathematical Field, General Relativity — que comparten una cámara, un bucle de render y un mismo selector de presets de clic-para-crear. Toda la física corre en refs y avanza dentro del bucle de animación, nunca en el estado de React; nada aquí es un segundo motor — el mismo parser, AST y solver EDO que impulsan cada otro espacio de MATH·LAB impulsan los tres modos. Sin eval / new Function.",
      ),
      h("Mathematical Field mode", "Modo Mathematical Field"),
      p(
        "dx/dt, dy/dt, dz/dt are typed as ordinary expressions and parsed into the same DynamicalSystem the 2D Dynamics workspace uses (makeSystem) — an arbitrary user-defined F: ℝ³→ℝ³, completely independent of the gravity Simulation. A grid of arrows samples F on a resolution³ box (or a 2D slice pinned to one axis, xy/xz/yz); probe streamlines integrate dx/dt = F(x) with the shared RK4 solver.",
        "dx/dt, dy/dt, dz/dt se escriben como expresiones normales y se parsean al mismo DynamicalSystem que usa el espacio 2D Dynamics (makeSystem) — un campo F: ℝ³→ℝ³ definido por el usuario, totalmente independiente de la Simulation de gravedad. Una grilla de flechas muestrea F en una caja resolution³ (o un corte 2D fijando un eje, xy/xz/yz); las líneas de corriente de sonda integran dx/dt = F(x) con el solver RK4 compartido.",
      ),
      ul(
        [
          "Vector field view: arrows scaled and colored by |F|.",
          "Divergence view: one colored dot per sample point, red = source (∇·F>0), blue = sink (∇·F<0).",
          "Curl view: ∇×F drawn as arrows.",
          "Slice modes (xy / xz / yz) confine the sample grid to a single plane instead of the full volume.",
        ],
        [
          "Vista de campo vectorial: flechas escaladas y coloreadas por |F|.",
          "Vista de divergencia: un punto coloreado por muestra, rojo = fuente (∇·F>0), azul = sumidero (∇·F<0).",
          "Vista de rotacional: ∇×F dibujado como flechas.",
          "Los modos de corte (xy / xz / yz) confinan la grilla de muestreo a un solo plano en vez del volumen completo.",
        ],
      ),
      p(
        "Divergence and curl are not a finite-difference hack over the sampled grid — both are built from the same symbolic Jacobian (jacobianField) the rest of the app already uses for gradient/Hessian/Laplacian. Curl is 3D-specific so it lives beside the field code, but it reuses that Jacobian rather than differentiating separately:",
        "Divergencia y rotacional no son un parche por diferencias finitas sobre la grilla muestreada — ambos se construyen con el mismo Jacobiano simbólico (jacobianField) que ya usa el resto de la app para gradiente/Hessiano/Laplaciano. El rotacional es específico de 3D, así que vive junto al código del campo, pero reutiliza ese Jacobiano en vez de derivar por separado:",
      ),
      math(String.raw`\nabla\!\cdot\!F = \frac{\partial F_x}{\partial x}+\frac{\partial F_y}{\partial y}+\frac{\partial F_z}{\partial z},\qquad \nabla\times F = \left(\frac{\partial F_z}{\partial y}-\frac{\partial F_y}{\partial z},\ \frac{\partial F_x}{\partial z}-\frac{\partial F_z}{\partial x},\ \frac{\partial F_y}{\partial x}-\frac{\partial F_x}{\partial y}\right)`),
      h("Newtonian Gravity mode", "Modo Newtonian Gravity"),
      p(
        "Two force laws share one seam (gravityModel.ts), selectable per run: softened (Plummer, the default) is finite everywhere by construction; exact (unsoftened 1/r²) is Newton's law verbatim, clamped at a distance floor (10⁻⁶) near r=0 with a visible hitFloor flag rather than silently substituting the softened formula.",
        "Dos leyes de fuerza comparten un mismo punto de acceso (gravityModel.ts), seleccionable por corrida: softened (Plummer, la opción por defecto) es finita en todas partes por construcción; exact (1/r² sin suavizar) es la ley de Newton literal, acotada por un piso de distancia (10⁻⁶) cerca de r=0 con una bandera hitFloor visible en vez de sustituir en silencio la fórmula suavizada.",
      ),
      math(String.raw`\begin{aligned}
\text{exact:}\quad \Phi &= -\frac{GM}{r}, \qquad g = \frac{GM}{r^{3}}\,\Delta \\[4pt]
\text{softened (Plummer):}\quad \Phi &= -\frac{GM}{\sqrt{r^{2}+\varepsilon^{2}}}, \qquad g = \frac{GM}{\left(r^{2}+\varepsilon^{2}\right)^{3/2}}\,\Delta
\end{aligned}`),
      p(
        "Every body carries an experimental gravitationalStrength multiplier (effectiveMass = mass × gravitationalStrength) with no physical meaning of its own. Kinetic energy is always tagged exact (a pure function of the current state, ½mv², not integration-dependent); potential and total energy are tagged numerical only while every active body's gravitationalStrength = 1 (a genuine, symmetric potential energy), and downgrade to proxy the instant any body's strength differs — the pairwise force stops being symmetric and conservation breaks by construction, not by integrator error. Momentum is tagged numerical: physically conserved under uniform strengths, but it still drifts under the integrator in practice.",
        "Cada cuerpo lleva un multiplicador experimental gravitationalStrength (effectiveMass = mass × gravitationalStrength) sin significado físico propio. La energía cinética siempre se etiqueta exact (función pura del estado actual, ½mv², no depende de la integración); la energía potencial y total se etiquetan numerical solo mientras todo cuerpo activo tenga gravitationalStrength = 1 (una energía potencial genuina y simétrica), y bajan a proxy en cuanto la fuerza de algún cuerpo difiere — la fuerza por pares deja de ser simétrica y la conservación se rompe por construcción, no por error del integrador. El momento se etiqueta numerical: conservado físicamente con fuerzas uniformes, pero igual deriva bajo el integrador en la práctica.",
      ),
      h("Space-time deformation is a proxy, not the metric", "La “deformación” del espacio-tiempo es un proxy, no la métrica"),
      p(
        "The optional Space-time deform. surface renders a rubber-sheet height field of the effective potential Φ (Plummer-softened) over the x,y plane — a pedagogical visualization of Φ, explicitly NOT the Einstein metric or a solution of any field equation.",
        "La superficie opcional Space-time deform. dibuja un campo de altura tipo “sábana elástica” del potencial efectivo Φ (suavizado tipo Plummer) sobre el plano x,y — una visualización pedagógica de Φ, explícitamente NO la métrica de Einstein ni solución de ecuación de campo alguna.",
      ),
      h("General Relativity mode", "Modo General Relativity"),
      p(
        "Minkowski, Schwarzschild and Kerr are exact analytic solutions of the vacuum Einstein field equations — flat spacetime; a static, spherically symmetric mass; a rotating, axisymmetric mass — not a numerical solver for the Einstein equations. Each metric's components are stored as source-expression strings and parsed through the same core parser used everywhere else in the app (ADR-004): known closed-form metrics plugged into one generic differential-geometry engine.",
        "Minkowski, Schwarzschild y Kerr son soluciones analíticas exactas de las ecuaciones de campo de Einstein en el vacío — espacio-tiempo plano; una masa estática y esféricamente simétrica; una masa rotante y axisimétrica — no un solver numérico de las ecuaciones de Einstein. Los componentes de cada métrica se guardan como cadenas de expresión fuente y se parsean con el mismo parser del núcleo usado en el resto de la app (ADR-004): métricas de forma cerrada conocidas conectadas a un único motor genérico de geometría diferencial.",
      ),
      p(
        "That engine is metric-agnostic and runs unchanged for all three metrics: the inverse metric, then Christoffel symbols Γ — differentiated symbolically from g_μν and tagged exact — then the Riemann/Ricci/Einstein tensors, obtained by numerically differentiating the already-exact Christoffel function via central finite differences and tagged numerical (a finite-difference proxy for an otherwise-exact tensor, a strictly weaker confidence than Christoffel itself).",
        "Ese motor es agnóstico a la métrica y corre sin cambios para las tres: la métrica inversa, luego los símbolos de Christoffel Γ — derivados simbólicamente de g_μν y etiquetados exact — luego los tensores de Riemann/Ricci/Einstein, obtenidos derivando numéricamente la función de Christoffel ya exacta por diferencias finitas centradas, etiquetados numerical (un proxy por diferencias finitas de un tensor por lo demás exacto, una confianza estrictamente más débil que la del propio Christoffel).",
      ),
      math(String.raw`\Gamma^{\mu}_{\ \alpha\beta} = \tfrac{1}{2}\,g^{\mu\nu}\left(\partial_\alpha g_{\nu\beta}+\partial_\beta g_{\nu\alpha}-\partial_\nu g_{\alpha\beta}\right)`),
      math(String.raw`\begin{aligned}
R^{\rho}_{\ \sigma\mu\nu} &= \partial_\mu \Gamma^{\rho}_{\ \nu\sigma} - \partial_\nu \Gamma^{\rho}_{\ \mu\sigma} + \Gamma^{\rho}_{\ \mu\lambda}\Gamma^{\lambda}_{\ \nu\sigma} - \Gamma^{\rho}_{\ \nu\lambda}\Gamma^{\lambda}_{\ \mu\sigma} \\[2pt]
R_{\mu\nu} &= R^{\rho}_{\ \mu\rho\nu}, \qquad R = g^{\mu\nu}R_{\mu\nu} \\[2pt]
G_{\mu\nu} &= R_{\mu\nu} - \tfrac{1}{2}g_{\mu\nu}R
\end{aligned}`),
      p(
        "Geodesic integration reuses the shared ODE solver registry (rk4/rkf45/…), packing position and 4-velocity into one 8-dimensional state exactly like the Mathematical Field probes above:",
        "La integración de la geodésica reutiliza el mismo registro de solvers EDO compartido (rk4/rkf45/…), empaquetando posición y 4-velocidad en un único estado de 8 dimensiones, igual que las sondas de Mathematical Field anteriores:",
      ),
      math(String.raw`\frac{dx^{\mu}}{d\tau} = u^{\mu}, \qquad \frac{du^{\mu}}{d\tau} = -\,\Gamma^{\mu}_{\ \alpha\beta}\,u^{\alpha}u^{\beta}`),
      h("Frame dragging (ZAMO)", "Arrastre de marco (ZAMO)"),
      p(
        "For a spinning Kerr hole, a zero-angular-momentum test particle (ZAMO) is launched with u^φ = ω(x)·u^t, where ω = −g_tφ/g_φφ. Because axisymmetry conserves L = g_tφu^t + g_φφu^φ along any geodesic in this metric family, that particle keeps L = 0 for its ENTIRE trajectory yet still has nonzero dφ/dτ wherever ω ≠ 0 — real frame dragging read straight off the conserved-quantity structure of the metric, not an animation trick. It vanishes identically for Minkowski/Schwarzschild (g_tφ = 0), which is the correct sanity check.",
        "Para un agujero de Kerr en rotación, una partícula de prueba de momento angular cero (ZAMO) se lanza con u^φ = ω(x)·u^t, donde ω = −g_tφ/g_φφ. Como la axisimetría conserva L = g_tφu^t + g_φφu^φ a lo largo de cualquier geodésica en esta familia de métricas, esa partícula mantiene L = 0 en TODA su trayectoria pero igual tiene dφ/dτ distinto de cero donde ω ≠ 0 — arrastre de marco real, leído directamente de la estructura de cantidades conservadas de la métrica, no un truco de animación. Se anula idénticamente para Minkowski/Schwarzschild (g_tφ = 0), que es la comprobación de cordura correcta.",
      ),
      math(String.raw`\omega(x) = -\frac{g_{t\phi}}{g_{\phi\phi}}, \qquad u^{\phi}=\omega(x)\,u^{t}\ \Rightarrow\ L = g_{t\phi}u^{t}+g_{\phi\phi}u^{\phi}=0`),
      p(
        "The 3D trace is a coordinate-position plot of the integrated geodesic (spherical→Cartesian for Schwarzschild/Kerr) — captioned in the UI explicitly as not a literal spacetime embedding.",
        "La traza 3D es un gráfico de posición-coordenada de la geodésica integrada (esférico→cartesiano para Schwarzschild/Kerr) — rotulada en la UI explícitamente como que no es una inmersión (embedding) literal del espacio-tiempo.",
      ),
      h("Click-to-spawn", "Clic para crear"),
      p(
        "All three modes share one body-preset picker — Particle, Planet, Star, Black Hole, Singularity — and one click-to-place flow. In Gravity mode a spawned body is a real N-body participant: its preset's mass, radius, softening and absorption radius feed straight into the physics. In Mathematical Field and General Relativity mode the SAME preset only supplies a marker's type and appearance (and, for GR, the clicked position converted into that metric's native coordinates) — mass, softening and absorption radius are never read for those two modes, so a preset can never leak physics parameters into a model it doesn't belong to.",
        "Los tres modos comparten un mismo selector de presets de cuerpo — Particle, Planet, Star, Black Hole, Singularity — y un mismo flujo de clic-para-colocar. En modo Gravity un cuerpo creado es un participante N-body real: la masa, radio, softening y radio de absorción del preset alimentan directamente la física. En Mathematical Field y General Relativity el MISMO preset solo aporta el tipo y apariencia del marcador (y, en GR, la posición del clic convertida a las coordenadas nativas de esa métrica) — masa, softening y radio de absorción nunca se leen en esos dos modos, así un preset nunca puede filtrar parámetros físicos a un modelo al que no pertenece.",
      ),
    ],
  },
  // ─── PHASE IV — ODEs ─────────────────────────────────────────────────────────
  {
    id: "odes",
    title: { en: "ODEs", es: "EDOs" },
    blocks: [
      p(
        "A general ODE solver architecture for dy/dt = f(t,y), y(t₀)=y₀. Fixed-step methods (Euler, Heun, RK2, RK4) and adaptive RKF45 with step-size control. All solvers share the ODEResult shape: samples, step count, convergence flag, error estimate, accepted/rejected steps. The method registry lets future solvers be added without rewriting callers.",
        "Una arquitectura general de solvers EDO para dy/dt = f(t,y), y(t₀)=y₀. Métodos de paso fijo (Euler, Heun, RK2, RK4) y RKF45 adaptativo con control de paso. Todos comparten la forma ODEResult: muestras, conteo de pasos, bandera de convergencia, estimación de error, pasos aceptados/rechazados. El registro de métodos permite añadir futuros solvers sin reescribir los llamadores.",
      ),
      h("Methods", "Métodos"),
      ul(
        ["Euler: order 1, 1 f-eval/step, explicit/conditionally stable.", "Heun (trapezoid): order 2, 2 f-evals.", "RK2 (midpoint): order 2, 2 f-evals.", "RK4: order 4, 4 f-evals, classic workhorse.", "RKF45: adaptive 4(5) pair, error-controlled step, local extrapolation (5th-order propagated); still explicit/non-stiff."],
        ["Euler: orden 1, 1 eval-f/paso, explícito/condicionalmente estable.", "Heun (trapecio): orden 2, 2 eval-f.", "RK2 (punto medio): orden 2, 2 eval-f.", "RK4: orden 4, 4 eval-f, caballo de batalla clásico.", "RKF45: par adaptativo 4(5), paso controlado por error, extrapolación local (5to orden propagado); sigue siendo explícito/no rígido."],
      ),
      h("Visualization & parameter sweeps", "Visualización y barridos de parámetros"),
      p(
        "Time series y(t), phase portraits, 3D trajectories, time scrubber/playback, parameter and IC sliders. Batch experiments compare methods (Euler vs RK4) on runtime, steps, error, trajectory shape, and stability.",
        "Serie temporal y(t), retratos de fase, trayectorias 3D, control temporal/playback, sliders de parámetros y CI. Experimentos por lotes comparan métodos (Euler vs RK4) en tiempo, pasos, error, forma de trayectoria, y estabilidad.",
      ),
      h("Numerical stability", "Estabilidad numérica"),
      p(
        "Explicit methods are conditionally stable; on stiff problems the step is bounded by stability, not accuracy. RKF45 adapts the step but is still explicit. Warnings are emitted for non-finite states and max-step caps. No unstable solution is presented as correct mathematics.",
        "Los métodos explícitos son condicionalmente estables; en problemas rígidos el paso está acotado por estabilidad, no precisión. RKF45 adapta el paso pero sigue siendo explícito. Se emiten advertencias por estados no-finitos y tope de pasos máximos. Ninguna solución inestable se presenta como matemática correcta.",
      ),
    ],
  },
  // ─── PHASE IV — PDEs ─────────────────────────────────────────────────────────
  {
    id: "pdes",
    title: { en: "PDEs", es: "EDPs" },
    blocks: [
      p(
        "An extensible PDE foundation (not a full library). Canonical examples: 1D heat (u_t = αu_xx), 1D wave (u_tt = c²u_xx), and 2D Laplace/Poisson (∇²u = f) via finite differences. The solver interface is clean so new discretizations can be added.",
        "Una base EDP extensible (no una librería completa). Ejemplos canónicos: calor 1D (u_t = αu_xx), onda 1D (u_tt = c²u_xx), y Laplace/Poisson 2D (∇²u = f) por diferencias finitas. La interfaz del solver es limpia para añadir nuevas discretizaciones.",
      ),
      h("1D Heat equation", "Ecuación del calor 1D"),
      p(
        "Explicit FTCS: u^{n+1}_i = u^n_i + α(Δt/Δx²)(u^n_{i+1} − 2u^n_i + u^n_{i-1}). Stability requires Δt ≤ Δx²/(2α). Dirichlet/Neumann boundary conditions supported. Visualization: heat map, surface, time evolution with a time control.",
        "FTCS explícito: u^{n+1}_i = u^n_i + α(Δt/Δx²)(u^n_{i+1} − 2u^n_i + u^n_{i-1}). Estabilidad requiere Δt ≤ Δx²/(2α). Condiciones de Dirichlet/Neumann soportadas. Visualización: mapa de calor, superficie, evolución temporal con control de tiempo.",
      ),
      h("1D Wave equation", "Ecuación de onda 1D"),
      p(
        "Explicit central differences in time and space: u^{n+1}_i = 2u^n_i − u^{n-1}_i + c²(Δt/Δx)²(u^n_{i+1} − 2u^n_i + u^n_{i-1}). CFL condition: cΔt/Δx ≤ 1. Initial displacement + velocity. Visualization: time-evolving string/surface.",
        "Diferencias centrales explícitas en tiempo y espacio: u^{n+1}_i = 2u^n_i − u^{n-1}_i + c²(Δt/Δx)²(u^n_{i+1} − 2u^n_i + u^n_{i-1}). Condición CFL: cΔt/Δx ≤ 1. Desplazamiento + velocidad iniciales. Visualización: cuerda/superficie que evoluciona en el tiempo.",
      ),
      h("2D Laplace/Poisson (steady)", "Laplace/Poisson 2D (estacionario)"),
      p(
        "5-point stencil: (u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1} − 4u_{i,j})/h² = f_{i,j}. Solved by direct Gaussian elimination on the banded system. Dirichlet boundary conditions. Visualization: 2D heat map, contour plot.",
        "Estrella de 5 puntos: (u_{i+1,j} + u_{i-1,j} + u_{i,j+1} + u_{i,j-1} − 4u_{i,j})/h² = f_{i,j}. Resuelto por eliminación gaussiana directa en el sistema de banda. Condiciones de Dirichlet. Visualización: mapa de calor 2D, gráfico de contorno.",
      ),
    ],
  },
  // ─── PHASE IV — PROBABILITY / STATISTICS ─────────────────────────────────────
  {
    id: "probability-statistics",
    title: { en: "Probability & Statistics", es: "Probabilidad y Estadística" },
    blocks: [
      p(
        "Distributions (Bernoulli, Binomial, Uniform, Normal, Exponential, Poisson) with closed-form moments, PMF/PDF, CDF, and seeded reproducible sampling. The distribution registry lets new families be added. Monte Carlo framework: generic estimator with standard error, confidence intervals, and seeded reproducibility.",
        "Distribuciones (Bernoulli, Binomial, Uniforme, Normal, Exponencial, Poisson) con momentos en forma cerrada, PMF/PDF, CDF, y muestreo sembrado reproducible. El registro de distribuciones permite añadir nuevas familias. Monte Carlo: estimador genérico con error estándar, intervalos de confianza, y reproducibilidad sembrada.",
      ),
      h("Descriptive statistics", "Estadística descriptiva"),
      p(
        "Mean, median, mode, variance, stdev, quantiles (type-7/R default), covariance, Pearson correlation. Dataset object (row-major, named columns) is the shared interchange format for statistics, regression, optimization, and experiments.",
        "Media, mediana, moda, varianza, desv. típica, cuantiles (tipo-7/default R), covarianza, correlación de Pearson. El objeto Dataset (fila-mayor, columnas nombradas) es el formato de intercambio compartido para estadística, regresión, optimización, y experimentos.",
      ),
      h("Regression", "Regresión"),
      p(
        "Linear and polynomial regression via least squares (QR/SVD). Coefficients, residuals, R², predictions with confidence information where justified. Correlation ≠ causation is explicitly noted.",
        "Regresión lineal y polinomial por mínimos cuadrados (QR/SVD). Coeficientes, residuos, R², predicciones con información de confianza donde se justifica. Correlación ≠ causalidad se nota explícitamente.",
      ),
      h("Visualization", "Visualización"),
      ul(
        ["Distributions: PMF/PDF curve, CDF, shaded probability intervals P(a<X<b), histogram of seeded samples.", "Datasets: scatter plots, histograms, box plots, correlation matrix heatmap.", "Time series: y(t) with trend slope from OLS."],
        ["Distribuciones: curva PMF/PDF, CDF, intervalos de probabilidad sombreados P(a<X<b), histograma de muestras sembradas.", "Datasets: scatter plots, histogramas, box plots, heatmap de matriz de correlación.", "Series temporales: y(t) con pendiente de tendencia por OLS."],
      ),
    ],
  },
  // ─── PHASE IV — NUMBER THEORY ────────────────────────────────────────────────
  {
    id: "number-theory",
    title: { en: "Number Theory", es: "Teoría de números" },
    blocks: [
      p(
        "Exact integer arithmetic using JavaScript bigint where precision would be lost: gcd, lcm, extended Euclidean algorithm, modular arithmetic/exponentiation, prime testing (deterministic Miller–Rabin for 64-bit), prime factorization (Pollard's ρ), Euler φ, Möbius μ. Collatz exploration with visual stopping-time plots.",
        "Aritmética exacta de enteros usando bigint de JavaScript donde se perdería precisión: mcd, mcm, Euclides extendido, aritmética/exponenciación modular, primalidad (Miller–Rabin determinista para 64-bit), factorización (Pollard ρ), φ de Euler, μ de Möbius. Exploración de Collatz con gráficos de tiempo de parada.",
      ),
      h("Visualizations", "Visualizaciones"),
      ul(
        ["Prime distribution & density.", "Modular multiplication tables & residue patterns.", "Collatz stopping times vs seed, max value, trajectory length."],
        ["Distribución y densidad de primos.", "Tablas de multiplicación modular y patrones de residuos.", "Tiempos de parada de Collatz vs semilla, valor máximo, longitud de trayectoria."],
      ),
    ],
  },
  // ─── PHASE IV — COMPLEX ANALYSIS ─────────────────────────────────────────────
  {
    id: "complex-analysis",
    title: { en: "Complex Analysis", es: "Análisis complejo" },
    blocks: [
      p(
        "Builds on the existing complex-number infrastructure. Visualization: complex plane, domain coloring (hue = arg f(z), brightness = |f(z)|), grid mapping (rectangular grid → deformed grid under f). Supported functions: z², e^z, 1/z, log z (branch behavior explicit).",
        "Se apoya en la infraestructura existente de números complejos. Visualización: plano complejo, domain coloring (matiz = arg f(z), brillo = |f(z)|), mapeo de cuadrícula (cuadrícula rectangular → cuadrícula deformada bajo f). Funciones soportadas: z², e^z, 1/z, log z (comportamiento de rama explícito).",
      ),
      h("Holomorphicity & Cauchy–Riemann", "Holomorfía y Cauchy–Riemann"),
      p(
        "For f(z) = u(x,y) + iv(x,y), the inspector checks u_x = v_y and u_y = −v_x (Cauchy–Riemann). Functions of z and z̄ are correctly identified as non-holomorphic. The complex derivative (when it exists) is distinguished from real partial derivatives.",
        "Para f(z) = u(x,y) + iv(x,y), el inspector comprueba u_x = v_y y u_y = −v_x (Cauchy–Riemann). Funciones de z y z̄ se identifican correctamente como no holomorfas. La derivada compleja (cuando existe) se distingue de las derivadas parciales reales.",
      ),
      h("Special functions", "Funciones especiales"),
      p(
        "Registry architecture (not a kitchen sink). Implemented: logGamma, Gamma, erf — only when numerical behavior is properly tested. Additional functions register by name.",
        "Arquitectura de registro (no un cajón de sastre). Implementados: logGamma, Gamma, erf — solo cuando el comportamiento numérico se testea correctamente. Funciones adicionales se registran por nombre.",
      ),
    ],
  },
  // ─── PHASE IV — UNITS / SCIENTIFIC COMPUTING ─────────────────────────────────
  {
    id: "scientific-computing",
    title: { en: "Scientific Computing: Units & Uncertainty", es: "Cálculo científico: Unidades e Incertidumbre" },
    blocks: [
      p(
        "Physical units as structured metadata: distance = 5 m, time = 2 s → velocity = 2.5 m/s. Unit conversion, addition compatibility checks, multiplication/division/powers, dimensional consistency (5 m + 2 s ⇒ dimension mismatch). Unit-aware symbolic expressions carry dimensions through the Inspector.",
        "Unidades físicas como metadatos estructurados: distancia = 5 m, tiempo = 2 s → velocidad = 2.5 m/s. Conversión de unidades, comprobación de compatibilidad en suma, multiplicación/división/potencias, consistencia dimensional (5 m + 2 s ⇒ dimension mismatch). Expresiones simbólicas unit-aware transportan dimensiones por el Inspector.",
      ),
      h("Constants registry", "Registro de constantes"),
      p(
        "Structured registry: mathematical constants (π, e, φ, τ), physical constants (c, G, h, k_B, …) with name, symbol, value, unit, source metadata. User-defined constants supported. No hard-coded constants scattered through the codebase.",
        "Registro estructurado: constantes matemáticas (π, e, φ, τ), constantes físicas (c, G, h, k_B, …) con nombre, símbolo, valor, unidad, metadatos de fuente. Constantes definidas por el usuario soportadas. Sin constantes hard-codeadas dispersas por el código.",
      ),
      h("Uncertainty propagation", "Propagación de incertidumbre"),
      p(
        "Measurement value ± absolute/relative uncertainty. Propagation through +, −, ×, ÷ with standard formulas. Foundation for future scientific computing; not a complete uncertainty theory.",
        "Valor de medición ± incertidumbre absoluta/relativa. Propagación por +, −, ×, ÷ con fórmulas estándar. Base para futuro cálculo científico; no una teoría completa de incertidumbre.",
      ),
      h("Numerical method registry", "Registro de métodos numéricos"),
      p(
        "Unified catalog (RootSolver, Integrator, ODESolver, Optimizer, LinearSolver, MonteCarloMethod) with name, capabilities, parameters, result type, and honest limitations. Powers solver comparison UIs and self-describing experiments.",
        "Catálogo unificado (RootSolver, Integrator, ODESolver, Optimizer, LinearSolver, MonteCarloMethod) con nombre, capacidades, parámetros, tipo de resultado, y limitaciones honestas. Alimenta UIs de comparación de solvers y experimentos auto-descriptivos.",
      ),
    ],
  },
  {
    id: "kernel",
    title: { en: "Math kernel", es: "Núcleo matemático" },
    blocks: [
      p(
        "All workspaces sit on one shared kernel. Phase I added first-class complex scalars, vectors and matrices, vector calculus (gradient / Hessian / Jacobian / Laplacian), numerical limits, adaptive integration, a small symbolic integrator, and Taylor expansion — every result labels itself as EXACT (symbolic) or an APPROXIMATION (numerical, with error metadata).",
        "Todos los espacios se apoyan en un único núcleo. La Fase I añadió escalares complejos, vectores y matrices de primera clase, cálculo vectorial (gradiente / Hessiano / Jacobiano / Laplaciano), límites numéricos, integración adaptativa, un integrador simbólico acotado y expansión de Taylor — cada resultado se etiqueta como EXACTO (simbólico) o APROXIMACIÓN (numérico, con metadatos de error).",
      ),
      h("Differential operators", "Operadores diferenciales"),
      math(String.raw`\nabla f = \Big(\tfrac{\partial f}{\partial x_1},\dots,\tfrac{\partial f}{\partial x_n}\Big),\quad H_{ij}=\tfrac{\partial^2 f}{\partial x_i\partial x_j},\quad J_{ij}=\tfrac{\partial f_i}{\partial x_j},\quad \nabla^2 f=\sum_i \tfrac{\partial^2 f}{\partial x_i^2}`),
      p(
        "These are symbolic (via the shared derivative engine) and also evaluate numerically; symbolic results are cross-validated against finite differences in the test suite.",
        "Son simbólicos (vía el motor de derivadas compartido) y también evalúan numéricamente; los resultados simbólicos se cross-validan contra diferencias finitas en la suite de tests.",
      ),
      h("Linear algebra", "Álgebra lineal"),
      p(
        "Matrix determinant, inverse, rank and linear solving use LU decomposition with partial pivoting (floating-point numerical operations, not exact symbolic). Vectors support dot, cross (ℝ³), norm, projection.",
        "Determinante, inversa, rango y resolución de sistemas usan descomposición LU con pivoteo parcial (operaciones numéricas en punto flotante, no simbólicas exactas). Los vectores soportan producto punto, cruz (ℝ³), norma, proyección.",
      ),
      h("Mathematical honesty", "Honestidad matemática"),
      ul(
        ["Numerical limit / integral / root results are approximations with error metadata — never presented as proofs.", "Symbolic integration covers a small SOUND subset (linearity, powers, sin/cos/exp of the bare variable, 1/x); anything else returns 'unsupported' rather than a wrong answer.", "Complex log / sqrt / inverse-trig use principal branches.", "General ℝⁿ homeomorphism and closed-form limits are not attempted — a numerical estimate is labeled as such."],
        ["Los resultados numéricos de límite / integral / raíz son aproximaciones con metadatos de error — nunca se presentan como pruebas.", "La integración simbólica cubre un subconjunto pequeño y correcto (linealidad, potencias, sin/cos/exp de la variable, 1/x); lo demás devuelve 'unsupported' en vez de una respuesta errónea.", "log / sqrt / trig inversas complejas usan ramas principales.", "No se intenta homeomorfismo general en ℝⁿ ni límites en forma cerrada — una estimación numérica se etiqueta como tal."],
      ),
    ],
  },
  {
    id: "safety",
    title: { en: "Notes & limits", es: "Notas y límites" },
    blocks: [
      ul(
        [
          "Security: no eval / new Function anywhere; only whitelisted functions evaluate. Invalid input while typing draws a gap, never crashes.",
          "Fractal deep zoom is bounded by df64 (~1e-12); fractional exponents use float32 (shallower).",
          "Bloch: one qubit, pure state, no decoherence (T1/T2) yet.",
          "3D implicit surfaces are sampled on a volume grid — very thin sheets may need a finer resolution.",
        ],
        [
          "Seguridad: sin eval / new Function en ningún lado; solo evalúan funciones en lista blanca. La entrada inválida mientras escribes dibuja un hueco, nunca revienta.",
          "El zoom profundo fractal está limitado por df64 (~1e-12); los exponentes fraccionarios usan float32 (menos profundo).",
          "Bloch: un qubit, estado puro, aún sin decoherencia (T1/T2).",
          "Las superficies implícitas 3D se muestrean en una malla de volumen — láminas muy delgadas pueden requerir más resolución.",
        ],
      ),
    ],
  },
];

export const UI = {
  title: { en: "Manual", es: "Manual" },
  subtitle: {
    en: "How every workspace works, with the underlying mathematics.",
    es: "Cómo funciona cada espacio, con la matemática subyacente.",
  },
};

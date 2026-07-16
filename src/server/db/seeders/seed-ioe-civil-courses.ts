import { db } from "../index";
import { academicCourses, collegeDepartmentProgramToCourses } from "../schema";

const PROGRAM_ID = "i2HvjyySxGkJ69Tcp8eRQ"; // BE Civil Program ID

const ioeCivilCourses = [
  // ========================================
  // First Year - First Part (Semester 1)
  // ========================================
  {
    name: "Engineering Mathematics I",
    code: "SH401",
    description:
      "This course provides students with a solid understanding of calculus and analytic geometry to apply these concepts in their engineering fields. Topics include derivatives and their applications (higher-order derivatives, mean value theorems, power series, indeterminate forms, asymptotes), integration and its applications (definite and indefinite integrals), plane analytic geometry (transformations of coordinates), and ordinary differential equations and their applications (methods for solving first-order, first-degree differential equations and second-order, first-degree linear differential equations with constant coefficients).",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Engineering Drawing I",
    code: "ME401",
    description:
      "Introduction to engineering drawing principles, orthographic projections, isometric views, sectional views, and development of surfaces. Course covers basic drawing techniques, lettering, dimensioning, and computer-aided drafting fundamentals.",
    credits: "2",
    level: "1-1",
  },
  {
    name: "Engineering Chemistry",
    code: "SH403",
    description:
      "This course provides fundamental knowledge of chemical principles relevant to engineering. Topics include electro-chemistry and buffer (electrochemical cells, electrode potential, Nernst equation, EMF of cells, buffer types and mechanisms, Henderson's equation, corrosion and its prevention), catalyst (introduction, action, characteristics, types, theories, and industrial applications), environmental chemistry (air pollution, water pollution, soil pollution, ozone depletion), engineering polymers (inorganic and organic polymers including silicones, polyurethane, polystyrene, PVC, Teflon, Nylon, Bakelite, epoxy resin), and 3-d transition elements and their applications.",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Fundamental of Thermodynamics & Heat Transfer",
    code: "ME402",
    description:
      "Study of basic thermodynamic principles including systems, properties, work and heat, laws of thermodynamics, properties of pure substances, and cycles. Heat transfer covers conduction, convection, and radiation with applications in engineering systems.",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Computer Programming",
    code: "CT401",
    description:
      "This course familiarizes students with computer software and high-level programming languages, developing practical skills using C programming. Topics include overview of computer software and programming languages, problem solving using computers (algorithm development, flowcharting), introduction to C programming, input and output operations, control statements (branching and looping), user-defined functions, arrays and strings, structures, pointers, and data files.",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Workshop Technology",
    code: "ME403",
    description:
      "Introduction to workshop practices including fitting, smithy, carpentry, welding, and machining operations. Covers safety practices, hand tools, machine tools, and basic manufacturing processes.",
    credits: "2",
    level: "1-1",
  },

  // ========================================
  // First Year - Second Part (Semester 2)
  // ========================================
  {
    name: "Applied Mechanics",
    code: "CE451",
    description:
      "Fundamental concepts of statics and dynamics including force systems, equilibrium, friction, centroid, moment of inertia, and kinematics of particles. Covers principles of mechanics applied to engineering problems.",
    credits: "4",
    level: "1-2",
  },
  {
    name: "Engineering Mathematics II",
    code: "SH451",
    description:
      "Continuation of Engineering Mathematics I covering multivariable calculus, partial differential equations, vector calculus, and applications to engineering problems.",
    credits: "3",
    level: "1-2",
  },
  {
    name: "Engineering Physics",
    code: "SH452",
    description:
      "Physics concepts applied to engineering including mechanics, heat and thermodynamics, waves and oscillations, electricity and magnetism, optics, and modern physics with emphasis on practical applications.",
    credits: "4",
    level: "1-2",
  },
  {
    name: "Basic Electronics Engineering",
    code: "EX451",
    description:
      "Introduction to semiconductor devices, diodes, transistors, amplifiers, oscillators, and basic digital electronics. Covers analog and digital circuits with applications.",
    credits: "3",
    level: "1-2",
  },
  {
    name: "Engineering Drawing II",
    code: "ME451",
    description:
      "Advanced engineering drawing topics including assembly drawings, machine drawing, and civil engineering drawing fundamentals. Covers detailed drawings, projections of solids, and intersection of surfaces.",
    credits: "2",
    level: "1-2",
  },
  {
    name: "Basic Electrical Engineering",
    code: "EE451",
    description:
      "Introduction to electrical engineering fundamentals including DC circuits, AC circuits, electromagnetic principles, transformers, and electrical machines with practical applications.",
    credits: "3",
    level: "1-2",
  },

  // ========================================
  // Second Year - First Part (Semester 3)
  // ========================================
  {
    name: "Engineering Geology I",
    code: "CE501",
    description:
      "This course provides civil engineering students with fundamental understanding of geology, including identification of rocks, minerals, geological structures, and processes, and their impact on engineering structures. Topics include geology and civil engineering, basic reviews of Earth (origin, age, components, structure, geological time scale, physical features, internal structure, plate tectonics, Himalayas formation), crystallography and mineralogy (crystal morphology, symmetry, crystal systems, physical/chemical/optical properties of minerals, classification and identification of common rock-forming minerals), petrology (introduction, petrography, petrogenesis, rock cycle, classification, structure, textures of rocks, engineering significance of different rock classes, macroscopic study of rocks), structural geology (rock deformations, attitude of geological structures including dip, strike, trend, plunge, measurement using geological maps and compass, primary sedimentary structures and secondary deformation structures including folds, faults, joints, field identification criteria), and geology of Nepal (physiography and tectonic divisions of Nepal Himalaya, geology of Terai, Siwalik, Lesser Himalaya, Higher Himalaya, and Tethys Himalaya Zones).",
    credits: "2",
    level: "2-1",
  },
  {
    name: "Strength of Materials",
    code: "CE502",
    description:
      "This course provides students with basic knowledge regarding material behavior, stress-strain relations, and their analysis. Topics include axial forces, shearing forces, and bending moments (plotting diagrams for determinate structures, concept of superposition, maximum shear force and bending moments, relationship between loads, shear forces, and bending moments), geometrical properties of sections (axes of symmetry, center of gravity, moment of inertia, polar moment of inertia, radius of gyration, product of inertia, principle moment and principle axes of inertia, Mohr's circle for moment of inertia), simple stress and strain (definitions of deformable bodies, internal forces, stress, strain, Hooke's law, stress-strain diagrams, Poisson's ratio, shear stress and strain, allowable stresses and factor of safety, stress concentrations, relationships between elastic constants), stress and strain analysis (stresses in inclined planes, principal stresses and planes, relationships between normal and shear stress, maximum shear stress, Mohr's circle for stress), thin-walled vessels (definition and characteristics), torsion (torsion of circular shafts, angle of twist, power transmission), theory of flexure (bending stresses in beams, shear stresses in beams, deflection of beams), and column theory (Euler's formula, Rankine's formula, eccentrically loaded columns).",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Applied Mechanics (Dynamics)",
    code: "CE503",
    description:
      "This course provides basic knowledge of dynamics portion of engineering mechanics, enabling students to understand basics of kinematics and kinetics for both particles and rigid bodies and their motion. Topics include curvilinear motion of particles (position vector, velocity, acceleration, derivatives of vector functions, rectangular, tangential, normal, radial, and transverse components, motion relative to a translating frame), kinetics of particles: energy and momentum methods (work done by a force, potential and kinetic energy, principles of work and energy, power and efficiency, conservation of energy, principle of impulse and momentum, impulsive motion and impact), system of particles (Newton's laws for a system of particles, linear and angular momentum, motion of mass center, conservation of momentum, kinetic energy, work-energy principles, impulse and momentum for a system of particles, steady stream of particles, system with variable mass), and kinematics of rigid bodies (introduction to translation, rotation, general plane motion, absolute and relative velocity in plane motion, instantaneous center of rotation, Coriolis acceleration, motion about a fixed point, general motion, three-dimensional motion).",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Surveying I",
    code: "CE504",
    description:
      "This course introduces civil engineering students to basic knowledge of land measurement and surveying techniques, enabling them to understand theory and field procedures for producing maps. Topics include introduction to surveying (objectives and principles, classification, measurements including linear and angular, scales, conventional signs, plan and map), distance measurement (types of measurements, techniques and instruments including chain, tape, EDM), compass surveying (types of compass, bearings, local attraction, magnetic declination, compass traversing, errors and adjustments), leveling (terms, types of leveling, leveling instruments, sources of errors, reduction of levels, contouring), theodolite surveying (types of theodolites, temporary and permanent adjustments, measurement of horizontal and vertical angles by direction and repetition methods), traverse surveying (traverse computation, latitude and departure, closing error and adjustment), tachometric surveying (principles, methods including stadia and tangential, sources of error), area and volume calculation (area by coordinates, double-meridian distance method, volume by average end area, prismoidal formula, mass diagram), modern surveying instruments (electro-optical, microwave, and total station instruments), and practical field work (distance measurement, area calculation, leveling, and angle measurement).",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Fluid Mechanics",
    code: "CE505",
    description:
      "This course is designed to provide basic knowledge of fluid mechanics to civil engineering students, helping them understand fundamental phenomena of fluid science and its application in civil engineering. Topics include fluid and its physical properties (basic concepts and definitions of fluid, shear stress in moving fluid, differences between solids and fluids, control volume and continuum, mass density, specific weight, specific gravity, specific volume, viscosity, compressibility, capillarity, surface tension, cavitation, vapor pressure, Newton's law of viscosity, ideal and real fluids, compressible and incompressible fluids), pressure and head (introduction and application in civil engineering, absolute and relative equilibrium, atmospheric, gauge, and absolute pressure, hydrostatics law of pressure distribution, Pascal's law, pressure measurement using manometers including piezometer, U-tube, differential, inverted U-tube, and Bourdon gauge), hydrostatics (pressure force and center of pressure on submerged bodies including plane and curved surfaces, computation of pressure forces on gates, dams, retaining structures), hydrokinematics (description of fluid flow including 1D, 2D, 3D, circulation and vorticity, rotational and irrotational flow, stream function and potential function, acceleration of a fluid particle), hydrodynamics (basic equations for fluid flow, continuity equations, momentum equation and applications including elbow reactions, jet propulsions, hydraulic jump, Navier-Stokes equation, Bernoulli's equation and applications), flow measurement (methods of measuring flow), momentum principle and flow analysis (concept of angular momentum), boundary layer theory (boundary layer concept and definition), flow past through submerged bodies (concept of aerofoil), similitude and physical modeling (dimensional analysis and dynamic similitude, Buckingham's method, model studies), and practical experiments including hydrostatic force on submerged body, stability of floating body, verification of Bernoulli's equation, impact of jet, flow through orifices, and flow over weirs).",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Civil Engineering Materials",
    code: "CE506",
    description:
      "This course introduces students to a wide range of materials used in construction and maintenance of civil engineering projects, emphasizing their properties and uses for selecting suitable materials for specific projects. Topics include introduction to civil engineering material (scope of subject, selection criteria, classification of construction materials), building stones (classification, characteristics, quarrying, dressing, uses, and tests), clay products (bricks including types, manufacturing, properties, uses, tests, tiles including types, manufacturing, uses, terra cotta), lime (classification, manufacturing, properties, and uses), cement (types, manufacturing, chemical composition, properties, uses, and tests), mortar (types, properties, and uses), timber (classification, properties, seasoning, preservation, defects, uses, and products including plywood and fiberboard), metals and alloys (ferrous metals including cast iron, wrought iron, steel, non-ferrous metals including aluminum, copper, lead, properties, types, and uses), paint and varnishes (types, constituents, properties, and uses), asphalt, bitumen, tar and miscellaneous materials (types, properties, and uses of asphalt, bitumen, and tar, glass, plastic materials, insulating materials, gypsum products, and composite materials), and practical lab tests (water absorption and specific gravity of brick, compressive strength of brick, consistency of cement, setting time of cement, soundness of cement, and compressive strength of cement).",
    credits: "2",
    level: "2-1",
  },

  // ========================================
  // Second Year - Second Part (Semester 4)
  // ========================================
  {
    name: "Hydraulics",
    code: "CE555",
    description:
      "This course provides basic knowledge of hydraulics essential for design of hydraulic structures and for students and engineers in hydraulic engineering. Topics include pipe flow (introduction to pipe flow, Reynolds experiment, laminar and turbulent flow, head loss, Darcy-Weisbach equation, resistance for commercial pipes, Colebrook-White equation, Moody's diagram, minor head losses), simple pipe flow problems and solutions (three types of simple pipe flow problems, pipes in series and parallel, siphons, computer programming for simple problems), three reservoirs problem and pipe networks (introduction to three reservoir problems and their solution procedures, pipe network problems including Hardy-Cross method), unsteady flow in pipes (basic equations for unsteady flow including celerity, Euler's Equation, continuity equation, pressure variation due to gradual and sudden closure of pipes, brief information on relief devices like surge tanks), basics of open channel flow (introduction, classification including natural/artificial, prismatic/non-prismatic, rigid/mobile boundary, geometric properties), uniform flow (Chezy's and Manning's equations, economic channels), energy and momentum principles in open channel flow (specific energy, specific force, critical depth, hydraulic jump), non-uniform gradually varied flow (basic assumptions, differential equation, classification of flow profiles, computations), non-uniform rapidly varied flow (weirs and flumes), and flow in mobile boundary channel (introduction to rigid and mobile boundary channels, design principles, incipient motion condition, design by various approaches including permissible velocity, tractive force, regime theory).",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Surveying II",
    code: "CE554",
    description:
      "The objective of this course is to introduce fundamental knowledge of land measurement and modern survey applications, enabling students to implement modern survey techniques in map making and civil engineering projects. Topics include traversing (needs and significance, specifications for horizontal and vertical control, field works, computation for closed and link traverses, omitted measurements), tacheometry (principle of optical distance measurements, stadia method, tangential method, booking and plotting details, sources of errors), trigonometric leveling (problems of heights and distances, reciprocal trigonometric leveling, determination of heights and distances of inaccessible objects), contouring (introduction, establishment of controls, contour interval and characteristics, methods of locating and interpolating contours, uses of contour maps), orientation (introduction, analytical intersection and resection, two/three-point resection), curves (types of curves and their uses, simple circular curves and their elements, calculation and setting out), photogrammetry and remote sensing (introduction to photogrammetry as a branch of surveying), field astronomy and GPS (introduction and definition of terms), total station (introduction to Total Station), geographic information system (GIS) (introduction to GIS), and practical field works (traverse survey, tacheometry application, intersection and resection using theodolite, trigonometric leveling, contouring, setting out curves, demonstration of Total Station and GPS/GIS).",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Theory of Structures I",
    code: "CE551",
    description:
      "This course aims to provide fundamental concepts and knowledge of structural analysis, focusing on statically determinate structures. Topics include introduction (types of structures based on material, structural mechanics, approaches to structural analysis, linearly elastic structures, non-linearity, computer-based methods, and principle of superposition), influence lines for simple structures (moving static loads, influence lines for statically determinate beams and trusses, indirect load applications, influence lines for support reactions, shear force, and bending moment), deflection of beams (introduction to deflection, differential equation of flexure, double integration method, area moment theorems, Macaulay's method, deflection using method of superposition), suspension cable systems (theory of suspended structures with un-stiffened cables, catenary and parabolic cables, elements of simple suspension bridges, stress determination in three-hinged stiffening girders, influence line diagrams), force method (definitions, primary systems, compatibility conditions, flexibility matrix calculations), displacement methods (definitions, kinematic indeterminacy, stiffness matrix formation and applications to beams, frames, and trusses), and plastic analysis (introduction to plastic analysis of bending members, plastic hinge, load factor, shape factor).",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Probability & Statistics",
    code: "SH552",
    description:
      "Statistical methods and probability theory applied to engineering problems. Topics include probability theory, random variables, probability distributions, sampling distributions, estimation, hypothesis testing, regression analysis, and correlation.",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Engineering Geology II",
    code: "CE553",
    description:
      "This course provides civil engineering students with knowledge of engineering geology, enabling them to measure, analyze, and interpret geological data for development and stability of civil infrastructure. Topics include introduction to engineering geology (engineering geological systems including rocks, soils, geological structures, geomorphology, hydrogeology, weathering, earthquakes, seismicity, geotechnical categorization of projects), engineering geology in Himalayas (major discontinuity systems of Nepal Himalaya, engineering geological problems in various zones including Terai, Siwaliks, Lesser Himalaya, Higher Himalaya, Tibetan-Tethys, and mitigation measures), hydrogeology (river channel morphology, origin and movement of groundwater, porosity, permeability, hydraulic transmissivity of rocks and sediments, aquifer systems in Nepal), geological hazards (introduction to major geological hazards like floods, GLOF, erosion, mass movement, earthquakes, and seismicity, their causes, types, structural control, evaluation, and mitigation), engineering geology in site selection, investigation and construction/excavation (types and methods of investigation, geological considerations for roads, canals, buildings, bridges, dams, reservoirs, tunnels, and underground structures), rock properties and laboratory tests (mechanical properties of rocks, Hoek-Brown failure criterion, and various laboratory tests including uniaxial compression, Brazilian tensile, triaxial compression, point load, Schmidt hammer, direct shear, slake durability), and rock mass classification (introduction to rock mass, discontinuity characters, and classification systems like Rock Mass Rating (RMR), NGI-Q system, and Geological Strength Index (GSI)).",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Building Drawing",
    code: "CE556",
    description:
      "The objective of this course is to introduce students to basic terminology, components, and elements of building drawing, with emphasis on drafting skills for floor plans, elevations, sections, and details of buildings. Topics include introduction to building and building drawing (structural systems, anatomy of a building, elements of a building, scale of building drawing), symbols and conventional signs (symbols and conventional signs used for building drawing), standard views (location plan, site plan, floor plans, elevations/facades, cross-sections, detail drawings), types of building drawing (concept drawing, presentation drawing, municipality drawing, measured drawing, and working drawing including architect's, structural, service, as-built drawing), introduction to building bye-laws (basic understanding of building bye-laws), and drawing sheets to be prepared (practical assignments include drawing load-bearing and frame structure buildings, floor plans, elevations, cross-sections, details, municipality drawings, measured drawings, and working drawings).",
    credits: "2",
    level: "2-2",
  },
  {
    name: "Soil Mechanics",
    code: "CE552",
    description:
      "This course covers concepts of soil engineering, including science and technology of soils and their application to civil engineering problems. Topics include principle of effective stress, capillarity, and permeability (introduction to effective stress, physical meaning, capillarity in soils, permeability, determination of coefficient of permeability, types of head, seepage forces, quicksand conditions), vertical stresses below applied loads (Boussinesq and Westergaard's equations, vertical stress distribution diagrams, stress beneath loaded areas, Newmark's influence chart), compressibility of soil (contact pressure and settlement profile, fundamentals of consolidation, one-dimensional laboratory consolidation test, void ratio-pressure plots, normally consolidated and over-consolidated clay, calculation of settlement, compression and swell indices, secondary consolidation, time rate of consolidation), and practical work (sieve analysis, determination of Atterberg limits, in-situ density by sand replacement and core cutter methods, determination of OMC and maximum dry density, unconfined compression test, direct shear test, constant head permeability test, and UU Triaxial Test).",
    credits: "3",
    level: "2-2",
  },

  // ========================================
  // Third Year - First Part (Semester 5)
  // ========================================
  {
    name: "Theory of Structures II",
    code: "CE601",
    description:
      "This course aims to familiarize students with terminologies and concepts of displacements, stresses, strains, and stiffness in indeterminate systems. Topics include formulation of structural problems, static and kinematic indeterminacy, force and displacement as operational parameters, Betti's law, Maxwell's reciprocal theorem, Castigliano's theorems, force method, analysis of indeterminate arches, slope deflection method, moment distribution method, stiffness matrix method, influence lines for indeterminate beams, and introduction to plastic analysis. Practical experiments include determining redundant reaction components in continuous beams, two-hinged arches, and symmetrical and unsymmetrical portal frames.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Foundation Engineering",
    code: "CE602",
    description:
      "Foundation Engineering syllabus includes topics such as site investigations, lateral earth pressure theories, retaining walls, arching in soils, braced cuts, flexible retaining structures, cofferdams, bearing capacity and settlement of shallow foundations, mat foundations, pile foundations, and foundation soil improvements including mechanical compaction, preloading, and soil stabilization using admixtures. Practical components include tutorials for each sub-section focusing on concepts, definitions, and numerical examples.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Concrete Technology and Masonry Structure",
    code: "CE603",
    description:
      "This course provides practical information on concrete technology and masonry structures. Topics include introduction to concrete and its materials, structure of concrete, mix design of concrete, properties of green and hardened concrete, testing of concrete and quality control, concrete durability, and masonry structures. The course objective is to build basic understanding of concrete ingredients, properties, quality assurance, quality control, concrete grades, and mix design, enabling students to understand concrete behavior and operations.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Water Supply Engineering",
    code: "CE605",
    description:
      "The objective of this course is to teach students functions of various components of a water supply system, water resources and their utilization, water demand determination, water quality, intake construction, water treatment technology, and construction of water mains and distribution systems. Topics include importance of water, types of water (pure, impure, potable, wholesome, polluted, contaminated), historical development and objectives of water supply systems, classification and selection of water sources, quantity of water (per capita demand, design periods, types of water demand, population forecasting), and water quality (impurities, hardness, alkalinity, living organisms). Practical exercises involve determining water temperature, color, turbidity, pH, suspended, dissolved, and total solids, dissolved oxygen, and optimum coagulant dose using jar test apparatus.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Engineering Hydrology",
    code: "CE606",
    description:
      "This course aims to teach students concept of hydrology and computational analysis for design and management of water resources projects. Topics include introduction to engineering hydrology, hydrologic cycle and water balance equations, precipitation (causes, measurement, analysis), evaporation and evapotranspiration, infiltration, streamflow measurement, runoff and hydrographs, hydrological routing, and frequency analysis. Tutorials involve estimating missing rainfall data, testing data inconsistencies, estimating mean rainfall, and estimating potential evapotranspiration using Penman's equation.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Numerical Methods",
    code: "SH603",
    description:
      "Numerical techniques for solving engineering mathematical problems. Topics include numerical methods for solving linear and non-linear equations, interpolation, numerical differentiation and integration, numerical solution of ordinary differential equations, and finite difference methods.",
    credits: "3",
    level: "3-1",
  },

  // ========================================
  // Third Year - Second Part (Semester 6)
  // ========================================
  {
    name: "Design of Steel and Timber Structure",
    code: "CE651",
    description:
      "The objective of this course is to enable students to design ordinary steel and timber structures and to provide advanced knowledge on design of complex steel and timber structures. Topics include steel structures and their analysis and design (introduction, structural steel and classification of sections, methods of analysis and design, design process and basis), working stress design method (basic assumptions, service load and permissible stresses, design in tension, compression, bending, and shear), limit state design method (safety and serviceability requirements, different limit states for steel design, design strength of materials, design loads, limit states of strength and serviceability), connections in steel structures (types of connections, welded connections including design of simple and eccentric welded connections, bolted connections including design of simple and eccentric bolted connections, introduction to riveted connections), tension members (types, sectional area, design of simple and built-up sections, design of lug angles, tension splices), compression members (types, buckling behavior of columns, design of simple and built-up sections, design of lateral bracing, design of eccentrically loaded columns, column bases including axially loaded and eccentrically loaded, column splices), flexure members (types of beams, design of simple beams, design of built-up beams, design of plate girders including elements, preliminary design, design for bending, shear, deflection, lateral stability, curtailment of plate, design of web and flange splices), design of roof trusses, timber structures and design methods, joints in timber structures, design of compression members in timber, and design of flexure member in timber.",
    credits: "4",
    level: "3-2",
  },
  {
    name: "Communication English",
    code: "SH651",
    description:
      "English language skills for engineering communication including technical writing, report writing, presentation skills, and effective communication in professional engineering contexts.",
    credits: "2",
    level: "3-2",
  },
  {
    name: "Engineering Economics",
    code: "CE655",
    description:
      "This course provides comprehensive coverage of engineering economics, explaining business operations, project decisions, and how engineering decisions impact profit. Topics include introduction to engineering economics (engineering economics and engineering economic decisions), cost concepts and behavior (direct material costs, direct labor costs, manufacturing overheads, non-manufacturing overheads, cost-volume analysis), understanding financial statements (balance sheet, income statement, cash-flow statements, financial ratio analysis), time value of money (compound interest, types of cash flows including single, uniform, linear gradient series, geometric gradient series, irregular), project evaluation techniques (project cash flows, payback period method, Net Present Value (NPV), Future Value Method, Annual Equivalent Method, Internal Rate of Return (IRR)), depreciation (straight-line method, declining balance method, sum of digits method), income tax and discounted cash-flow models (effect of income tax on cash flows, development of discounted cash-flow models on EXCEL), project risk analysis (sensitivity analysis, breakeven analysis, probability concepts, probability distributions on Excel), and economic analysis in public sector.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Building Technology",
    code: "CE652",
    description:
      "The course aims to introduce functional requirements of buildings, their components, special works, special treatments in buildings, and sustainable building practices. Topics include introduction (built environment, history of building technology, classification of buildings), functional requirement of building (orientation and planning, lighting and thermal performance, ventilation and air conditioning, sound and acoustics), sub-structure and superstructure works (site exploration, foundation types, excavation, load-bearing structures including stone masonry, composite, hollow block, cavity wall, concrete 3D printing, wall finishes, frame structures including reinforced cement concrete and steel construction), building components and services (doors and windows, horizontal and vertical circulation including corridors, ladders, stairs, lifts, escalators, ramps, flooring), special works on building, and sustainable building.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Sanitary Engineering",
    code: "CE656",
    description:
      "This course aims to provide comprehensive knowledge of sanitary and wastewater engineering and management, covering basic theories, principles, designs, and practical knowledge in these fields. Topics include introduction (definitions of common terms including sewage/wastewater, domestic sewage, industrial sewage, sanitary sewage, storm water, sullage, sewer, sewerage, rubbish, garbage, refuse/solid waste, importance of wastewater and solid waste management, wastewater and solid waste management methods including collection, conveyance, treatment, disposal, objectives of sewage disposal, sanitation systems including conservancy and water carriage, sewerage systems and types including separate, combined, partially separate), quantity of wastewater (Dry Weather Flow (DWF) and Wet Weather Flow (WWF), sources of sanitary sewage, factors affecting quantity, determination of quantity, determination of storm water quantity), design and construction of sewers (design criteria, shapes of sewers, sewer materials, design of sewers for separate and combined systems, construction of sewers), sewer appurtenances (necessity, introduction, importance, use, construction, and working mechanism of manholes, drop manholes, lamp holes, street inlets, catch basins, flushing devices, sand, grease, oil traps, inverted siphons, sewer outlets, ventilating shafts, and wastewater/storm water regulators), wastewater microbiology (microbes of interest and their roles in wastewater including bacteria, fungi, algae, protozoa), characteristics and examination of wastewater (physical, chemical, biological characteristics, analysis methods), wastewater disposal (methods of disposal), wastewater treatment (various treatment processes), sludge treatment and disposal (sources, necessity of treatment, characteristics, determination of volume, treatment methods, disposal methods), and onsite sanitation of waste from isolated facilities.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Transportation Engineering I",
    code: "CE653",
    description:
      "The objective of this course is to enable students to plan, survey, and design road projects, and to gain knowledge of road development and planning in Nepalese context. Topics include introduction to transportation planning and engineering (modes of transportation, historical development of roads in Nepal, transport planning including national network, urban road network, ring roads, classification of roads), highway alignment and engineering survey (requirements and factors controlling highway alignment, stages of engineering survey), geometric design of highway (scope, basic design controls and criteria, elements of cross-section, horizontal and vertical alignments, sight distance, superelevation, transition curves), highway drainage (importance, causes of moisture variation in sub-grade soil, surface drainage, subsurface drainage systems), road materials (classification, sub-grade soil, road aggregate, bituminous road binders, bituminous mixes), and laboratory work (tests on aggregates and bitumen).",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Irrigation and Drainage",
    code: "CE654",
    description:
      "This course aims to provide students with knowledge in planning, design, development, operation, maintenance, and management of irrigation systems, including demand analysis, irrigation methods, and layout of irrigation structures. Topics include introduction (definition, advantages and disadvantages of irrigation, status and need of irrigation development in Nepal, crops, commanded areas, irrigation intensity, methods of field irrigation, planning of irrigation projects), irrigation water requirements (relation between duty, delta, and crop periods, crop water requirements including Penman's method, operational water requirements, water losses, effective rainfall, soil-moisture-irrigation relationship, depth and frequency of irrigation, irrigation efficiencies, design discharges for canals), canal irrigation system (classification of canals, components, alignment, alluvial and non-alluvial canals, canal standards, balancing canal depth, distribution systems), design of canals (design capacity, sediment transport, tractive force approach, design of stable canals, design of alluvial canals including Kennedy's & Lacey's Theory, design of lined canals), diversion headworks (component parts of weir/barrage, Bligh's, Lane's, and Khosla's seepage theory, design of sloping glacies weir bay, undersluice, silt excluder, silt ejector, head regulator), canal structures (cross-regulators and distributary head regulators, canal falls, canal outlets, cross-drainage works, river training works), waterlogging and drainage (causes of waterlogging, ill effects, remedies, types of drains, design of surface and subsurface drainage systems, salinity control), and pumps for irrigation and drainage (types, selection, performance).",
    credits: "3",
    level: "3-2",
  },

  // ========================================
  // Fourth Year - First Part (Semester 7)
  // ========================================
  {
    name: "Hydropower Engineering",
    code: "CE704",
    description:
      "This course covers the principles and applications of hydropower engineering including hydropower potential assessment, plant layout, turbine selection, electrical systems, and environmental considerations for hydropower projects in Nepal.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Project Engineering",
    code: "CE701",
    description:
      "This course covers project management comprehensively. Topics include introduction to project and project management (definition, characteristics, classification, objectives, goals, life cycle phases, environment, introduction to project management), project appraisal and project formulation, project planning and scheduling (techniques like Bar charts and Critical Path Method (CPM), use of planning software), project implementation and controlling (monitoring, evaluation, project control cycle, elements of control including time, cost, quality, schedule control, cost control using Earned Value Analysis, quality control, introduction to Project Management Information Systems (PMIS)), project risk analysis and management, introduction to project financing (project finance, capital structure planning, capital budgeting decisions), and tutorials (writing project proposals, scheduling using Bar chart & CPM, scheduling using planning software, project control methods using EVA, and capital budgeting exercises).",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Transportation Engineering II",
    code: "CE703",
    description:
      "This course focuses on advanced concepts in transportation engineering including pavement design, traffic engineering, transportation planning, and sustainable transportation systems.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Estimating & Costing",
    code: "CE705",
    description:
      "This course provides knowledge and skills related to estimating and costing in civil engineering projects. Topics include preparation of detailed estimates, rate analysis, cost indices, financial aspects of projects, and contract management.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Design of RCC Structure",
    code: "CE702",
    description:
      "The purpose of this course is to provide knowledge and skills for design of various reinforced concrete building elements. Topics include concrete structures and design methods (introduction to reinforced concrete structures, design methods, characteristic strengths and loads, design process, basis for design), design of beams (flexural behavior of reinforced concrete, design of rectangular and flanged beam sections), design of footings (design of spread, isolated, combined, and mat foundations), design and detailing of slabs, staircases, columns, and ductile detailing. Practical sessions involve testing beams for pure bending, pure shear, and combined bending-shear failure, and practical work on making skeletons of beam-column connections and beam-slabs.",
    credits: "4",
    level: "4-1",
  },
  {
    name: "Elective I",
    code: "CE725",
    description:
      "Elective course in Civil Engineering. Options include Bio-Engineering, Water and Wastewater Quality Analysis, Soil Conservation and Watershed Management, Trail Suspension Bridge, or Structural Dynamics.",
    credits: "3",
    level: "4-1",
  },

  // ========================================
  // Fourth Year - Second Part (Semester 8)
  // ========================================
  {
    name: "Computational Techniques in Civil Engineering",
    code: "CE751",
    description:
      "Application of computational methods and software tools in civil engineering including finite element analysis, computer-aided design, and numerical modeling for structural, geotechnical, and hydraulic problems.",
    credits: "3",
    level: "4-2",
  },
  {
    name: "Engineering Professional Practice",
    code: "CE752",
    description:
      "Professional practice, ethics, legal aspects, and regulations in civil engineering practice including contract law, professional liability, tendering processes, and project management in engineering practice.",
    credits: "2",
    level: "4-2",
  },
  {
    name: "Technology Environment and Society",
    code: "CE753",
    description:
      "Impact of technology on society, environmental considerations in engineering, sustainable development, and social responsibility of engineers including environmental impact assessment, pollution control, and green engineering practices.",
    credits: "2",
    level: "4-2",
  },
  {
    name: "Construction Management",
    code: "CE754",
    description:
      "Principles and practices of construction management including project planning, scheduling, resource management, quality control, safety management, and construction economics for civil engineering projects.",
    credits: "3",
    level: "4-2",
  },
  {
    name: "Project II",
    code: "CE755",
    description:
      "Capstone project where students apply theoretical knowledge to real-world scenarios, develop problem-solving skills, and gain practical experience in project management and execution. Project topics vary across areas such as structural engineering, geotechnical engineering, transportation engineering, environmental engineering, and water resources engineering.",
    credits: "4",
    level: "4-2",
  },
];

async function seedIOECivilCourses() {
  console.log("🌱 Seeding IOE BE Civil Engineering courses...");

  try {
    let createdCount = 0;
    let skippedCount = 0;
    const courseLinks = [];

    for (const course of ioeCivilCourses) {
      try {
        // Check if course already exists by code
        const existingCourses = await db.query.academicCourses.findMany();
        const existingCourse = existingCourses.find(
          (c) => c.code === course.code,
        );

        let courseId: string;

        if (existingCourse) {
          courseId = existingCourse.id;
          skippedCount++;
          console.log(
            `⏭️ Course already exists: ${course.code} - ${course.name}`,
          );
        } else {
          // Generate a unique ID and slug
          courseId = crypto.randomUUID();
          const slug = course.code.toLowerCase().replace(/[^a-z0-9-]/g, "-");

          // Insert course
          await db.insert(academicCourses).values({
            id: courseId,
            name: course.name,
            slug: slug,
            code: course.code,
            description: course.description,
            credits: course.credits,
            isActive: true,
          });

          createdCount++;
          console.log(`✅ Created course: ${course.code} - ${course.name}`);
        }

        // Check if course is already linked to program
        const existingLinks =
          await db.query.collegeDepartmentProgramToCourses.findMany();
        const existingLink = existingLinks.find(
          (l) => l.programId === PROGRAM_ID && l.courseId === courseId,
        );

        if (!existingLink) {
          courseLinks.push({
            id: crypto.randomUUID(),
            programId: PROGRAM_ID,
            courseId: courseId,
            code: course.code,
            credits: course.credits,
            yearNumber: Number(course.level.split("-")[0]),
            partNumber: Number(course.level.split("-")[1]),
            courseType: course.name.toLowerCase().includes("elective")
              ? ("elective" as const)
              : ("core" as const),
            isActive: true,
          });
        }
      } catch (error: any) {
        console.error(
          `❌ Error creating course ${course.code}:`,
          error.message,
        );
      }
    }

    // Create program-course links
    if (courseLinks.length > 0) {
      await db.insert(collegeDepartmentProgramToCourses).values(courseLinks);
      console.log(`✅ Created ${courseLinks.length} program-course links`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${createdCount} courses`);
    console.log(`   ⏭️ Skipped: ${skippedCount} courses`);
    console.log(`   🔗 Linked: ${courseLinks.length} courses to program`);
    console.log(`✨ IOE BE Civil Engineering course seeding completed!`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seedIOECivilCourses()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

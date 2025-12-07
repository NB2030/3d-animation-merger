import * as THREE from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from './GLTFExporter.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { isElectron, setupFileInputAdapter, adaptFileWriting } from './electron-adapter.js';

class App {
    constructor(m) {
    	// Get elements
        this.$canvas = document.querySelector('canvas')
        this.$source = document.getElementById('source')
        this.$animation = document.getElementById('source-animations')
        this.$textureMap = document.getElementById('texture-map')
        this.$export = document.getElementById('export-btn')
        this.$reset = document.getElementById('reset-btn')
        this.$ui = document.getElementById('animations-ui')
        this.$transformBtns = document.querySelectorAll('.transform-btn')
        this.$resetTransformBtn = document.querySelector('.reset-transform-btn')
        this.$resetCameraBtn = document.querySelector('.reset-camera-btn')
        this.$inPlaceCheckbox = document.getElementById('in-place-checkbox')
        this.$filenameInput = document.getElementById('filename-input')
        
        // Search and filter elements
        this.$animationsSearch = document.getElementById('animations-search')
        this.$animationsCount = document.getElementById('animations-count')
        
        // Drag and drop state
        this.draggedItem = null
        this.draggedIndex = null

        // Texture type elements
        this.$textureTypeBtns = document.querySelectorAll('.texture-type-btn')
        this.$shadedSection = document.getElementById('shaded-textures')
        this.$pbrSection = document.getElementById('pbr-textures')
        
        // PBR mode elements
        this.$usePackedTexture = document.getElementById('use-packed-texture')
        this.$packedSection = document.getElementById('packed-texture-section')
        this.$separateSection = document.getElementById('separate-textures-section')
        
        // PBR texture inputs
        this.$textureBaseColor = document.getElementById('texture-basecolor')
        this.$textureNormal = document.getElementById('texture-normal')
        this.$texturePacked = document.getElementById('texture-packed')
        this.$textureMetallic = document.getElementById('texture-metallic')
        this.$textureRoughness = document.getElementById('texture-roughness')
        this.$textureAO = document.getElementById('texture-ao')
        this.$textureEmissive = document.getElementById('texture-emissive')

        // Events
        this.$source.addEventListener('change', this.onSourceChange.bind(this))
        this.$animation.addEventListener('change', this.onAnimationChange.bind(this))
        this.$textureMap.addEventListener('change', this.onTextureChange.bind(this))

        // PBR texture events
        this.$textureBaseColor.addEventListener('change', (e) => this.onPBRTextureChange(e, 'map'))
        this.$textureNormal.addEventListener('change', (e) => this.onPBRTextureChange(e, 'normalMap'))
        this.$texturePacked.addEventListener('change', this.onPackedTextureChange.bind(this))
        this.$textureMetallic.addEventListener('change', (e) => this.onPBRTextureChange(e, 'metalnessMap'))
        this.$textureRoughness.addEventListener('change', (e) => this.onPBRTextureChange(e, 'roughnessMap'))
        this.$textureAO.addEventListener('change', (e) => this.onPBRTextureChange(e, 'aoMap'))
        this.$textureEmissive.addEventListener('change', (e) => this.onPBRTextureChange(e, 'emissiveMap'))

        // Texture type switching
        this.$textureTypeBtns.forEach(btn => {
            btn.addEventListener('click', this.onTextureTypeChange.bind(this))
        })
        
        // Packed texture mode toggle
        this.$usePackedTexture.addEventListener('change', this.onPackedModeToggle.bind(this))

        // Tab switching
        this.$tabBtns = document.querySelectorAll('.tab-btn')
        this.$tabBtns.forEach(btn => {
            btn.addEventListener('click', this.onTabChange.bind(this))
        })

        this.$export.addEventListener('click', this.exportGLB.bind(this))
        this.$reset.addEventListener('click', () => window.location.reload())
        
        // In Place checkbox event
        this.$inPlaceCheckbox.addEventListener('change', this.onInPlaceToggle.bind(this))
        
        // Search animations
        this.$animationsSearch.addEventListener('input', this.onSearchAnimations.bind(this))
        
        // Transform mode buttons
        this.$transformBtns.forEach(btn => {
            btn.addEventListener('click', this.onTransformModeClick.bind(this))
        })
        
        // Reset transform button
        this.$resetTransformBtn.addEventListener('click', this.onResetTransform.bind(this))
        
        // Reset camera button
        this.$resetCameraBtn.addEventListener('click', this.onResetCamera.bind(this))
        
        // Settings modal elements
        this.$settingsBtn = document.getElementById('settings-btn')
        this.$settingsModal = document.getElementById('settings-modal')
        this.$settingsCloseBtn = document.getElementById('settings-close-btn')
        this.$bgColorPicker = document.getElementById('bg-color-picker')
        this.$resetBgColor = document.getElementById('reset-bg-color')
        this.$gridColorPicker = document.getElementById('grid-color-picker')
        this.$resetGridColor = document.getElementById('reset-grid-color')
        this.$gridSizeSlider = document.getElementById('grid-size-slider')
        this.$gridSizeValue = document.getElementById('grid-size-value')
        this.$resetGridSize = document.getElementById('reset-grid-size')
        this.$gridDivisionsSlider = document.getElementById('grid-divisions-slider')
        this.$gridDivisionsValue = document.getElementById('grid-divisions-value')
        this.$resetGridDivisions = document.getElementById('reset-grid-divisions')
        
        // Animation controls elements
        this.$animationControlsBar = document.getElementById('animation-controls-bar')
        this.$playPauseBtn = document.getElementById('play-pause-btn')
        this.$loopBtn = document.getElementById('loop-btn')
        this.$playIcon = this.$playPauseBtn?.querySelector('.play-icon')
        this.$pauseIcon = this.$playPauseBtn?.querySelector('.pause-icon')
        this.$animCurrentTime = document.getElementById('anim-current-time')
        this.$animTotalTime = document.getElementById('anim-total-time')
        this.$animProgressBar = document.getElementById('anim-progress-bar')
        this.$animProgressSlider = document.getElementById('anim-progress-slider')
        this.$animSpeedInput = document.getElementById('anim-speed-input')
        
        // Settings events
        this.$settingsBtn.addEventListener('click', this.openSettings.bind(this))
        this.$settingsCloseBtn.addEventListener('click', this.closeSettings.bind(this))
        this.$settingsModal.addEventListener('click', (e) => {
            if(e.target === this.$settingsModal) this.closeSettings()
        })
        this.$bgColorPicker.addEventListener('input', this.onBgColorChange.bind(this))
        this.$resetBgColor.addEventListener('click', this.resetBgColor.bind(this))
        this.$gridColorPicker.addEventListener('input', this.onGridColorChange.bind(this))
        this.$resetGridColor.addEventListener('click', this.resetGridColor.bind(this))
        this.$gridSizeSlider.addEventListener('input', this.onGridSizeChange.bind(this))
        this.$resetGridSize.addEventListener('click', this.resetGridSize.bind(this))
        this.$gridDivisionsSlider.addEventListener('input', this.onGridDivisionsChange.bind(this))
        this.$resetGridDivisions.addEventListener('click', this.resetGridDivisions.bind(this))
        
        // Animation controls events
        this.$playPauseBtn?.addEventListener('click', this.togglePlayPause.bind(this))
        this.$loopBtn?.addEventListener('click', this.toggleLoop.bind(this))
        this.$animProgressSlider?.addEventListener('input', this.onProgressSliderChange.bind(this))
        this.$animProgressSlider?.addEventListener('mousedown', this.onProgressSliderMouseDown.bind(this))
        this.$animProgressSlider?.addEventListener('mouseup', this.onProgressSliderMouseUp.bind(this))
        this.$animSpeedInput?.addEventListener('input', this.onSpeedChange.bind(this))
        
        // Drag and drop for animations list
        this.$ui.addEventListener('dragover', this.onAnimationDragOver.bind(this))
        this.$ui.addEventListener('dragleave', this.onAnimationDragLeave.bind(this))
        this.$ui.addEventListener('drop', this.onAnimationDrop.bind(this))
        
        this.isPlaying = false
        this.isLooping = true
        this.wasPlayingBeforeScrub = false
        this.animationSpeed = 1.0
        this.customTexture = null;
        this.textureType = 'shaded'; // 'shaded' or 'pbr'
        this.usePackedTexture = false;
        this.packedTexture = null;
        this.pbrTextures = {
            map: null,
            normalMap: null,
            metalnessMap: null,
            roughnessMap: null,
            aoMap: null,
            emissiveMap: null
        };
        
        this.resize();
        this.resizeBind = this.resize.bind(this);
        window.addEventListener('resize', this.resizeBind); 
    }			    

    init() {    
        this.initRenderer();  
        this.initScene();     
        this.initLoaders();

        // Initialize Electron adapters if running in Electron
        if (isElectron()) {
            this.initElectronAdapters();
        }

        this.render();   
    }

    initRenderer() {        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.$canvas,
            preserveDrawingBuffer: true // for screenshots
        })
        this.renderer.shadowMap.enabled = true 
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setClearColor("#15151a");

        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.clock = new THREE.Clock()
        this.previousTime = 0
    }

    initScene() {
        this.scene = new THREE.Scene();

        this.gridHelper = new THREE.GridHelper(15, 10, "#969fbf", "#969fbf");
        this.gridHelper.position.y = 0;
        this.gridHelper.position.x = 0;
        console.log(this.gridHelper.material);
        this.gridHelper.material.opacity = 1
        this.gridHelper.material.transparent = true
        this.scene.add( this.gridHelper );

        const axesHelper = new THREE.AxesHelper( .5 );
        this.scene.add( axesHelper );        

        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        this.scene.add(ambientLight)
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
        hemi.position.set(0, 1, 0)
        this.scene.add(hemi)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
        dirLight.position.set(5, 10, 5)
        dirLight.castShadow = true
        dirLight.shadow.mapSize.set(1024, 1024)
        dirLight.shadow.camera.near = 0.1
        dirLight.shadow.camera.far = 50
        this.scene.add(dirLight)

        // Base camera
        this.camera = new THREE.PerspectiveCamera(60, this.sizes.width / this.sizes.height, 0.01,100)
        this.camera.position.set(0, 1, 4)
        this.scene.add(this.camera)

        // Controls
        this.controls = new OrbitControls(this.camera, this.$canvas)
        this.controls.target.set(0, 0.75, 0)
        this.controls.enableDamping = true

        // Wrapper
        this.wrapper = new THREE.Group();
        this.wrapper.position.set(0,0,0); 
        this.scene.add(this.wrapper) 

        this.transformControl = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControl.addEventListener( 'dragging-changed', (event) => {
            this.controls.enabled = ! event.value;
        } );
        this.scene.add(this.transformControl)

        // Increased fog distance for better visibility when zoomed out
        this.scene.fog = new THREE.Fog("#15151a", 50, 200);

        const pmrem = new THREE.PMREMGenerator(this.renderer)
        const envTex = pmrem.fromScene(new RoomEnvironment(this.renderer), 0.04).texture
        this.scene.environment = envTex
    }

    initLoaders() {
        this.fbxLoader = new FBXLoader();
        this.gltfLoader = new GLTFLoader();
    }

    initElectronAdapters() {
        console.log('Initializing Electron adapters...');
        
        // Adapt source FBX input with FBX filter
        setupFileInputAdapter(this.$source, {
            title: 'Select Source FBX Model',
            filters: [
                { name: 'FBX Files', extensions: ['fbx'] },
                { name: 'GLB Files', extensions: ['glb'] },
                { name: 'GLTF Files', extensions: ['gltf'] }
            ],
            properties: ['openFile']
        });
        
        // Adapt animation FBX input with multi-select
        setupFileInputAdapter(this.$animation, {
            title: 'Select Animation FBX Files',
            filters: [
                { name: 'FBX Files', extensions: ['fbx'] },
                { name: 'GLB Files', extensions: ['glb'] },
                { name: 'GLTF Files', extensions: ['gltf'] }
            ],
            properties: ['openFile', 'multiSelections']
        });
        
        // Adapt shaded texture input with image filters
        setupFileInputAdapter(this.$textureMap, {
            title: 'Select Texture Image',
            filters: [
                { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg'] }
            ],
            properties: ['openFile']
        });
        
        // Adapt PBR texture inputs with image filters
        const imageFilters = [
            { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg'] }
        ];
        
        setupFileInputAdapter(this.$textureBaseColor, {
            title: 'Select Base Color Texture',
            filters: imageFilters,
            properties: ['openFile']
        });
        
        setupFileInputAdapter(this.$textureNormal, {
            title: 'Select Normal Map',
            filters: imageFilters,
            properties: ['openFile']
        });
        
        setupFileInputAdapter(this.$texturePacked, {
            title: 'Select Packed ORM Texture',
            filters: imageFilters,
            properties: ['openFile']
        });
        
        setupFileInputAdapter(this.$textureMetallic, {
            title: 'Select Metallic Map',
            filters: imageFilters,
            properties: ['openFile']
        });
        
        setupFileInputAdapter(this.$textureRoughness, {
            title: 'Select Roughness Map',
            filters: imageFilters,
            properties: ['openFile']
        });
        
        setupFileInputAdapter(this.$textureAO, {
            title: 'Select Ambient Occlusion Map',
            filters: imageFilters,
            properties: ['openFile']
        });
        
        setupFileInputAdapter(this.$textureEmissive, {
            title: 'Select Emissive Map',
            filters: imageFilters,
            properties: ['openFile']
        });
        
        console.log('Electron adapters initialized successfully');
    }

    resize() {
        console.log('resize');
        this.BCR = this.$canvas.getBoundingClientRect()

        this.sizes = {
            width: this.BCR.width,
            height: this.BCR.height
        }

        this.renderer && this.renderer.setSize(this.sizes.width, this.sizes.height);

        this.renderer && console.log(this.renderer);

        if(this.camera) {
            // Update camera        
            this.camera.aspect = this.sizes.width / this.sizes.height
            this.camera.updateProjectionMatrix()
        }

        // Update renderer
        if(this.renderer) {
            this.renderer.setSize(this.sizes.width, this.sizes.height)
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }
    }

    render() {        
        const elapsedTime = this.clock.getElapsedTime()
        const deltaTime = elapsedTime - this.previousTime
        this.previousTime = elapsedTime

        // Update controls
        this.controls.update()

        // Render
        this.renderer.render(this.scene, this.camera)

        // Check if current animation is a static pose
        const isStaticPose = this.animation && this.animation.getClip().duration < 0.01;

        // Update mixer only if playing and not a static pose
        if(this.mixer && this.isPlaying && !isStaticPose) {
            this.mixer.update(deltaTime)
        }
        
        // Update animation progress display
        this.updateAnimationProgress()

        // Call tick again on the next frame
        this.raf = window.requestAnimationFrame(this.render.bind(this))
    }

    async onSourceChange(e) {
        return new Promise(async (resolve) => {
            const file = e.currentTarget.files[0];      

            const filename = file.name;
            const extension = filename.split( '.' ).pop().toLowerCase();
            
            // Add loading state
            const label = e.currentTarget.closest('label');
            label.classList.add('loading');
            
            // Auto-set filename from source file (without extension)
            const baseFilename = filename.replace(/\.[^/.]+$/, '');
            if(this.$filenameInput && !this.$filenameInput.value) {
                this.$filenameInput.value = baseFilename;
            }

            // Get file contents (either from Electron adapter or FileReader)
            let contents;
            if(file.data) {
                // File already loaded by Electron adapter
                contents = file.data;
            } else {
                // Use FileReader for browser
                contents = await new Promise((resolveRead) => {
                    const reader = new FileReader();
                    reader.addEventListener('load', (event) => {
                        resolveRead(event.target.result);
                    }, { once: true });
                    reader.readAsArrayBuffer(file);
                });
            }

            // Handle GLB/GLTF files
            if(extension === 'glb' || extension === 'gltf') {
                this.gltfLoader.parse(contents, '', (gltf) => {
                    if(this.object) { this.disposeObject(this.object); this.scene.remove(this.object); }
                    
                    this.object = gltf.scene;
                    this.object.animations = gltf.animations || [];
                    
                    if(this.object.animations.length) {
                        this.mixer = new THREE.AnimationMixer(this.object);
                        this.object.traverse(function(obj) { obj.frustumCulled = false; });
                    }
                    
                    this.processLoadedModel();
                    label.classList.remove('loading');
                    resolve();
                }, (error) => {
                    console.error('Error loading GLB/GLTF:', error);
                    label.classList.remove('loading');
                    resolve();
                });
                return;
            }

            // Handle FBX files
            try {
                if(this.object) { this.disposeObject(this.object); this.scene.remove(this.object); }

                this.object = this.fbxLoader.parse( contents );
                this.object.scale.set(0.01,0.01,0.01)

                if(this.object.animations.length) {
                    this.mixer = new THREE.AnimationMixer( this.object );
                    this.object.traverse(function(obj) { obj.frustumCulled = false; });                   

                    // this.object.animations.forEach( ( clip ) => {                          
                    //     this.mixer.clipAction( clip ).play();                                      
                    // } );                
                }

                this.processLoadedModel();
                
                // Remove loading state
                label.classList.remove('loading');

                resolve();
            } catch(error) {
                console.error('Error loading FBX:', error);
                label.classList.remove('loading');
                resolve();
            }
        })
    }

    processLoadedModel() {
        this.object.traverse((child) => {
            if(child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                const m = child.material
                if(m && m.map) {
                    m.map.colorSpace = THREE.SRGBColorSpace
                    m.needsUpdate = true
                }
                if(Array.isArray(m)) {
                    for(const mat of m) {
                        if(mat && mat.map) {
                            mat.map.colorSpace = THREE.SRGBColorSpace
                            mat.needsUpdate = true
                        }
                    }
                }
                if(m && !m.map) {
                    if(m.color) m.color.set(0xffffff)
                }
            }
        })

        // Store original animations and apply In Place if needed
        this.originalAnimations = this.object.animations.map(clip => clip.clone());
        if(this.$inPlaceCheckbox && this.$inPlaceCheckbox.checked) {
            this.object.animations = this.makeAnimationsInPlace(this.originalAnimations);
        }
        
        this.updateUI()
        this.fixNonPBRMaterials()
        
        // Apply textures based on current type
        if(this.textureType === 'shaded' && this.customTexture) {
            this.applyTextureToModel(this.customTexture);
        } else if(this.textureType === 'pbr') {
            this.applyPBRTexturesToModel();
        }
        
        this.scene.add(this.object)

        console.log(this.object); 

        // Only attach transform control if not in 'none' mode
        const activeBtn = document.querySelector('.transform-btn.active');
        const activeMode = activeBtn ? activeBtn.dataset.mode : 'none';
        if(activeMode !== 'none') {
            this.transformControl.attach(this.object);
        }
    }

    async onAnimationChange(e) {
        const files = e.currentTarget.files;        

        if(!files) return;

        const label = e.currentTarget.closest('label');
        label.classList.add('loading');

        for(let file of files) {
            if(!this.object) {
                await this.onSourceChange(e);
                break;
            } else {
                const extension = file.name.split('.').pop().toLowerCase();
                
                // Get file contents (either from Electron adapter or FileReader)
                let contents;
                if(file.data) {
                    // File already loaded by Electron adapter
                    contents = file.data;
                } else {
                    // Use FileReader for browser
                    contents = await new Promise((resolveRead) => {
                        const reader = new FileReader();
                        reader.addEventListener('load', (event) => {
                            resolveRead(event.target.result);
                        }, { once: true });
                        reader.readAsArrayBuffer(file);
                    });
                }
                
                // Handle GLB/GLTF animation files
                if(extension === 'glb' || extension === 'gltf') {
                    await new Promise((resolve) => {
                        this.gltfLoader.parse(contents, '', (gltf) => {
                            if(gltf.animations && gltf.animations.length) {
                                for(let animation of gltf.animations) {
                                    animation.name = file.name.split('.')[0];
                                    
                                    if(!this.originalAnimations) {
                                        this.originalAnimations = [];
                                    }
                                    this.originalAnimations.push(animation.clone());
                                    
                                    if(this.$inPlaceCheckbox && this.$inPlaceCheckbox.checked) {
                                        const processed = this.makeAnimationsInPlace([animation]);
                                        this.object.animations.push(processed[0]);
                                    } else {
                                        this.object.animations.push(animation);
                                    }
                                }
                            }
                            
                            this.updateUI();
                            this.fixNonPBRMaterials();
                            resolve();
                        }, (error) => {
                            console.error('Error loading GLB/GLTF animation:', error);
                            resolve();
                        });
                    });
                } else {
                    // Handle FBX animation files
                    try {
                        let object = this.fbxLoader.parse( contents );

                        if(object.animations.length) {
                            for(let animation of object.animations) {
                                animation.name = file.name.split('.')[0];
                                // Add to original animations
                                if(!this.originalAnimations) {
                                    this.originalAnimations = [];
                                }
                                this.originalAnimations.push(animation.clone());
                                
                                // Add to current animations (apply In Place if needed)
                                if(this.$inPlaceCheckbox && this.$inPlaceCheckbox.checked) {
                                    const processed = this.makeAnimationsInPlace([animation]);
                                    this.object.animations.push(processed[0]);
                                } else {
                                    this.object.animations.push(animation);
                                }
                            }                        
                        }

                        this.updateUI();
                        this.fixNonPBRMaterials();
                    } catch(error) {
                        console.error('Error loading FBX animation:', error);
                    }
                }
            }        
        }

        label.classList.remove('loading');
        e.currentTarget.value = '';
    }

    onAnimationDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.$ui.classList.add('drag-over');
    }

    onAnimationDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.$ui.classList.remove('drag-over');
    }

    async onAnimationDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.$ui.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if(!files || files.length === 0) return;

        // Filter FBX and GLB/GLTF files
        const modelFiles = Array.from(files).filter(file => {
            const ext = file.name.toLowerCase();
            return ext.endsWith('.fbx') || ext.endsWith('.glb') || ext.endsWith('.gltf');
        });

        if(modelFiles.length === 0) {
            console.warn('No FBX/GLB/GLTF files found in dropped items');
            return;
        }

        // Show loading state
        this.$ui.classList.add('loading');

        for(let file of modelFiles) {
            const extension = file.name.split('.').pop().toLowerCase();
            
            if(!this.object) {
                // If no source model, load first file as source
                const fakeEvent = {
                    currentTarget: {
                        files: [file],
                        closest: () => ({ 
                            classList: { 
                                add: () => {}, 
                                remove: () => {} 
                            } 
                        })
                    }
                };
                await this.onSourceChange(fakeEvent);
                break;
            } else {
                // Load as animation
                if(extension === 'glb' || extension === 'gltf') {
                    // Handle GLB/GLTF
                    await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.addEventListener('load', (event) => {
                            const contents = event.target.result;
                            
                            this.gltfLoader.parse(contents, '', (gltf) => {
                                if(gltf.animations && gltf.animations.length) {
                                    for(let animation of gltf.animations) {
                                        animation.name = file.name.split('.')[0];
                                        
                                        if(!this.originalAnimations) {
                                            this.originalAnimations = [];
                                        }
                                        this.originalAnimations.push(animation.clone());
                                        
                                        if(this.$inPlaceCheckbox && this.$inPlaceCheckbox.checked) {
                                            const processed = this.makeAnimationsInPlace([animation]);
                                            this.object.animations.push(processed[0]);
                                        } else {
                                            this.object.animations.push(animation);
                                        }
                                    }
                                }
                                
                                this.updateUI();
                                this.fixNonPBRMaterials();
                                resolve();
                            }, (error) => {
                                console.error('Error loading GLB/GLTF:', error);
                                resolve();
                            });
                        }, { once: true });
                        reader.readAsArrayBuffer(file);
                    });
                } else {
                    // Handle FBX
                    const reader = new FileReader();
                    await new Promise((resolve) => {
                        reader.addEventListener('load', (event) => {
                            const contents = event.target.result;
                            let object = this.fbxLoader.parse(contents);

                            if(object.animations.length) {
                                for(let animation of object.animations) {
                                    animation.name = file.name.split('.')[0];
                                    
                                    // Add to original animations
                                    if(!this.originalAnimations) {
                                        this.originalAnimations = [];
                                    }
                                    this.originalAnimations.push(animation.clone());
                                    
                                    // Add to current animations (apply In Place if needed)
                                    if(this.$inPlaceCheckbox && this.$inPlaceCheckbox.checked) {
                                        const processed = this.makeAnimationsInPlace([animation]);
                                        this.object.animations.push(processed[0]);
                                    } else {
                                        this.object.animations.push(animation);
                                    }
                                }
                            }

                            this.updateUI();
                            this.fixNonPBRMaterials();
                            resolve();
                        }, { once: true });
                        reader.readAsArrayBuffer(file);
                    });
                }
            }
        }

        // Remove loading state
        this.$ui.classList.remove('loading');
        
        console.log(`Loaded ${modelFiles.length} model file(s) via drag and drop`);
    }

    onTabChange(e) {
        const tabName = e.currentTarget.dataset.tab;
        
        // Update button states
        this.$tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Toggle tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        const activeTab = document.getElementById(`tab-${tabName}`);
        if(activeTab) {
            activeTab.classList.add('active');
            activeTab.style.display = 'flex';
        }
        
        console.log('Tab changed to:', tabName);
    }

    onTextureTypeChange(e) {
        const type = e.currentTarget.dataset.type;
        this.textureType = type;
        
        // Update button states
        this.$textureTypeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Toggle packed mode selector visibility
        const pbrModeSelector = document.getElementById('pbr-mode-selector-fixed');
        
        // Toggle sections
        if(type === 'shaded') {
            this.$shadedSection.style.display = '';
            this.$pbrSection.style.display = 'none';
            if(pbrModeSelector) pbrModeSelector.style.display = 'none';
        } else {
            this.$shadedSection.style.display = 'none';
            this.$pbrSection.style.display = '';
            if(pbrModeSelector) pbrModeSelector.style.display = '';
        }
        
        console.log('Texture type changed to:', type);
    }

    async onTextureChange(e) {
        const file = e.currentTarget.files[0];
        if(!file) return;

        const label = e.currentTarget.closest('label');
        label.classList.add('loading');

        try {
            // Get file data URL (either from Electron adapter or FileReader)
            let dataURL;
            if(file.data) {
                // File already loaded by Electron adapter - convert to data URL
                const blob = new Blob([file.data]);
                dataURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(blob);
                });
            } else {
                // Use FileReader for browser
                dataURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.addEventListener('load', (event) => {
                        resolve(event.target.result);
                    }, { once: true });
                    reader.readAsDataURL(file);
                });
            }

            const img = new Image();
            img.onload = () => {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(dataURL);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.flipY = true;
                
                this.customTexture = texture;
                
                if(this.object) {
                    this.applyTextureToModel(texture);
                }
                
                // Add thumbnail preview
                this.addTextureThumbnail(label, dataURL);
                
                label.classList.remove('loading');
                console.log('Shaded texture loaded and applied');
            };
            img.onerror = () => {
                console.error('Failed to load texture image');
                label.classList.remove('loading');
            };
            img.src = dataURL;
        } catch(error) {
            console.error('Error loading texture:', error);
            label.classList.remove('loading');
        }
    }
    
    addTextureThumbnail(label, imageSrc) {
        // Remove existing thumbnail if any
        const existingThumb = label.querySelector('.texture-preview');
        if(existingThumb) existingThumb.remove();
        
        // Create new thumbnail
        const thumb = document.createElement('img');
        thumb.className = 'texture-preview';
        thumb.src = imageSrc;
        thumb.title = 'Click to view full size';
        thumb.addEventListener('click', () => {
            window.open(imageSrc, '_blank');
        });
        
        label.appendChild(thumb);
        
        // Trigger animation
        setTimeout(() => thumb.classList.add('loaded'), 10);
    }

    onPackedModeToggle(e) {
        this.usePackedTexture = e.currentTarget.checked;
        
        if(this.usePackedTexture) {
            this.$packedSection.style.display = '';
            this.$separateSection.style.display = 'none';
        } else {
            this.$packedSection.style.display = 'none';
            this.$separateSection.style.display = '';
        }
        
        console.log('Packed texture mode:', this.usePackedTexture);
    }

    async onPackedTextureChange(e) {
        const file = e.currentTarget.files[0];
        if(!file) return;

        const label = e.currentTarget.closest('label');
        label.classList.add('loading');

        try {
            // Get file data URL (either from Electron adapter or FileReader)
            let dataURL;
            if(file.data) {
                // File already loaded by Electron adapter - convert to data URL
                const blob = new Blob([file.data]);
                dataURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(blob);
                });
            } else {
                // Use FileReader for browser
                dataURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.addEventListener('load', (event) => {
                        resolve(event.target.result);
                    }, { once: true });
                    reader.readAsDataURL(file);
                });
            }

            const img = new Image();
            img.onload = () => {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(dataURL);
                texture.colorSpace = THREE.LinearSRGBColorSpace;
                texture.flipY = true;
                
                this.packedTexture = texture;
                
                // Set the packed texture to all three channels
                this.pbrTextures.aoMap = texture;
                this.pbrTextures.roughnessMap = texture;
                this.pbrTextures.metalnessMap = texture;
                
                if(this.object) {
                    this.applyPBRTexturesToModel();
                }
                
                // Add thumbnail preview
                this.addTextureThumbnail(label, dataURL);
                
                label.classList.remove('loading');
                console.log('Packed ORM texture loaded and applied');
            };
            img.onerror = () => {
                console.error('Failed to load packed texture image');
                label.classList.remove('loading');
            };
            img.src = dataURL;
        } catch(error) {
            console.error('Error loading packed texture:', error);
            label.classList.remove('loading');
        }
    }

    async onPBRTextureChange(e, mapType) {
        const file = e.currentTarget.files[0];
        if(!file) return;

        const label = e.currentTarget.closest('label');
        label.classList.add('loading');

        try {
            // Get file data URL (either from Electron adapter or FileReader)
            let dataURL;
            if(file.data) {
                // File already loaded by Electron adapter - convert to data URL
                const blob = new Blob([file.data]);
                dataURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(blob);
                });
            } else {
                // Use FileReader for browser
                dataURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.addEventListener('load', (event) => {
                        resolve(event.target.result);
                    }, { once: true });
                    reader.readAsDataURL(file);
                });
            }

            const img = new Image();
            img.onload = () => {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(dataURL);
                
                // Set correct color space based on map type
                if(mapType === 'map' || mapType === 'emissiveMap') {
                    texture.colorSpace = THREE.SRGBColorSpace;
                } else {
                    texture.colorSpace = THREE.LinearSRGBColorSpace;
                }
                
                texture.flipY = true;
                
                this.pbrTextures[mapType] = texture;
                
                if(this.object) {
                    this.applyPBRTexturesToModel();
                }
                
                // Add thumbnail preview
                this.addTextureThumbnail(label, dataURL);
                
                label.classList.remove('loading');
                console.log(`PBR ${mapType} loaded and applied`);
            };
            img.onerror = () => {
                console.error(`Failed to load PBR ${mapType} image`);
                label.classList.remove('loading');
            };
            img.src = dataURL;
        } catch(error) {
            console.error(`Error loading PBR ${mapType}:`, error);
            label.classList.remove('loading');
        }
    }

    applyTextureToModel(texture) {
        if(!this.object) return;
        
        this.object.traverse((child) => {
            if(child.isMesh) {
                if(Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if(mat.map) mat.map.dispose();
                        mat.map = texture;
                        mat.needsUpdate = true;
                    });
                } else {
                    if(child.material.map) child.material.map.dispose();
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            }
        });
    }

    applyPBRTexturesToModel() {
        if(!this.object) return;
        
        this.object.traverse((child) => {
            if(child.isMesh) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach(mat => {
                    // Convert to PBR material if not already
                    if(!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) {
                        const newMat = new THREE.MeshStandardMaterial({
                            color: mat.color || new THREE.Color(0xffffff),
                            transparent: mat.transparent,
                            opacity: mat.opacity !== undefined ? mat.opacity : 1,
                            side: mat.side
                        });
                        
                        if(Array.isArray(child.material)) {
                            const index = child.material.indexOf(mat);
                            child.material[index] = newMat;
                        } else {
                            child.material = newMat;
                        }
                        
                        mat.dispose();
                        mat = Array.isArray(child.material) ? child.material[child.material.indexOf(newMat)] : child.material;
                    }
                    
                    // Apply PBR textures
                    if(this.pbrTextures.map) {
                        if(mat.map) mat.map.dispose();
                        mat.map = this.pbrTextures.map;
                    }
                    
                    if(this.pbrTextures.normalMap) {
                        if(mat.normalMap) mat.normalMap.dispose();
                        mat.normalMap = this.pbrTextures.normalMap;
                        mat.normalScale = new THREE.Vector2(1, 1);
                    }
                    
                    // Handle packed texture (ORM format: R=AO, G=Roughness, B=Metallic)
                    if(this.usePackedTexture && this.packedTexture) {
                        // Use the same texture for all three channels
                        // Three.js will automatically read the correct channel for each map
                        if(mat.aoMap) mat.aoMap.dispose();
                        mat.aoMap = this.packedTexture;
                        mat.aoMapIntensity = 1.0;
                        
                        if(mat.roughnessMap) mat.roughnessMap.dispose();
                        mat.roughnessMap = this.packedTexture;
                        mat.roughness = 1.0;
                        
                        if(mat.metalnessMap) mat.metalnessMap.dispose();
                        mat.metalnessMap = this.packedTexture;
                        mat.metalness = 1.0;
                    } else {
                        // Use separate textures
                        if(this.pbrTextures.metalnessMap) {
                            if(mat.metalnessMap) mat.metalnessMap.dispose();
                            mat.metalnessMap = this.pbrTextures.metalnessMap;
                            mat.metalness = 1.0;
                        }
                        
                        if(this.pbrTextures.roughnessMap) {
                            if(mat.roughnessMap) mat.roughnessMap.dispose();
                            mat.roughnessMap = this.pbrTextures.roughnessMap;
                            mat.roughness = 1.0;
                        }
                        
                        if(this.pbrTextures.aoMap) {
                            if(mat.aoMap) mat.aoMap.dispose();
                            mat.aoMap = this.pbrTextures.aoMap;
                            mat.aoMapIntensity = 1.0;
                        }
                    }
                    
                    if(this.pbrTextures.emissiveMap) {
                        if(mat.emissiveMap) mat.emissiveMap.dispose();
                        mat.emissiveMap = this.pbrTextures.emissiveMap;
                        mat.emissive = new THREE.Color(0xffffff);
                        mat.emissiveIntensity = 1.0;
                    }
                    
                    mat.needsUpdate = true;
                });
            }
        });
    }

    fixNonPBRMaterials() {
        if(!this.object) return;
        this.object.traverse((child) => {
            if(!child.isMesh || !child.material) return;
            const mat = child.material;
            const toSRGB = (tex) => { if(tex && tex.colorSpace !== THREE.SRGBColorSpace) { tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; } };
            toSRGB(mat.map);
            toSRGB(mat.emissiveMap);
            const isNonPBR = mat.isMeshPhongMaterial || mat.isMeshLambertMaterial || mat.isMeshBasicMaterial;
            if(isNonPBR) {
                const opts = {
                    map: mat.map || null,
                    color: mat.color ? mat.color.clone() : new THREE.Color(0xffffff),
                    transparent: !!mat.transparent,
                    opacity: mat.opacity !== undefined ? mat.opacity : 1,
                    side: mat.side
                };
                const basic = new THREE.MeshBasicMaterial(opts);
                child.material = basic;
                child.material.needsUpdate = true;
            } else if(mat.isMeshStandardMaterial) {
                if(mat.metalness === undefined) mat.metalness = 0;
                if(mat.roughness === undefined) mat.roughness = 1;
            }
        });
    }

    updateUI() {
        while(this.$ui.children.length) {
            this.$ui.children[0].remove()
        }

        console.log(JSON.parse(JSON.stringify(this.object.animations)));
        if(this.object.animations.length) {
            for(let i = 0; i < this.object.animations.length; i++) {
                let animation = this.object.animations[i];
                console.log(animation.name);
                
                // Create container for animation item
                let container = document.createElement('div')
                container.className = 'animation-item'
                container.draggable = true
                container.dataset.index = i
                
                // Drag and drop events
                container.addEventListener('dragstart', (e) => {
                    this.draggedItem = container
                    this.draggedIndex = i
                    container.classList.add('dragging')
                    e.dataTransfer.effectAllowed = 'move'
                })
                
                container.addEventListener('dragend', () => {
                    container.classList.remove('dragging')
                    document.querySelectorAll('.animation-item').forEach(item => {
                        item.classList.remove('drag-over')
                    })
                })
                
                container.addEventListener('dragover', (e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if(this.draggedItem !== container) {
                        container.classList.add('drag-over')
                    }
                })
                
                container.addEventListener('dragleave', () => {
                    container.classList.remove('drag-over')
                })
                
                container.addEventListener('drop', (e) => {
                    e.preventDefault()
                    container.classList.remove('drag-over')
                    
                    if(this.draggedItem !== container) {
                        const targetIndex = parseInt(container.dataset.index)
                        // Reorder animations array
                        const draggedAnimation = this.object.animations[this.draggedIndex]
                        this.object.animations.splice(this.draggedIndex, 1)
                        this.object.animations.splice(targetIndex, 0, draggedAnimation)
                        this.updateUI()
                    }
                })
                
                // Create input for animation name
                let input = document.createElement('input')
                input.type = "text"
                input.value = animation.name;
                input.readOnly = true;
                input.className = 'animation-name-input';
                
                input.addEventListener('click', () => {
                    // Only play animation if not in edit mode
                    if(input.readOnly) {
                        // Remove active class from all animation items
                        document.querySelectorAll('.animation-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        // Add active class to current item
                        container.classList.add('active');
                        
                        // Stop previous animation if any
                        if(this.animation) {
                            this.animation.stop();
                        }
                        
                        // Play new animation
                        this.animation = this.mixer.clipAction(animation);
                        
                        // Check if this is a static pose
                        const isStaticPose = animation.duration < 0.01;
                        
                        if(isStaticPose) {
                            // For static poses, set to LoopOnce and clamp when finished
                            this.animation.setLoop(THREE.LoopOnce);
                            this.animation.clampWhenFinished = true;
                        } else {
                            this.animation.setLoop(this.isLooping ? THREE.LoopRepeat : THREE.LoopOnce);
                        }
                        
                        // Set animation speed
                        this.animation.timeScale = this.animationSpeed;
                        this.animation.play();
                        
                        // Update play/pause state
                        this.isPlaying = true;
                        this.updatePlayPauseButton();
                        this.updateLoopButton();
                    }
                })
                
                // Create rename button
                let renameBtn = document.createElement('button')
                renameBtn.className = 'rename-animation-btn'
                renameBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>`
                renameBtn.title = 'Rename animation'
                
                let isEditing = false;
                let originalName = animation.name;
                
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if(!isEditing) {
                        // Enter edit mode
                        isEditing = true;
                        originalName = input.value;
                        input.readOnly = false;
                        input.focus();
                        input.select();
                        renameBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>`
                        renameBtn.title = 'Save name';
                        container.classList.add('editing');
                    } else {
                        // Save and exit edit mode
                        const newName = input.value.trim() || `Animation_${i}`;
                        animation.name = newName;
                        
                        // Also update in originalAnimations if it exists
                        if(this.originalAnimations && this.originalAnimations[i]) {
                            this.originalAnimations[i].name = newName;
                        }
                        
                        console.log(`Animation renamed to: ${newName}`);
                        
                        input.readOnly = true;
                        isEditing = false;
                        renameBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>`
                        renameBtn.title = 'Rename animation';
                        container.classList.remove('editing');
                        this.updateAnimationsCount();
                    }
                })
                
                // Handle Enter key to save
                input.addEventListener('keydown', (e) => {
                    if(e.key === 'Enter' && !input.readOnly) {
                        e.preventDefault();
                        renameBtn.click();
                    } else if(e.key === 'Escape' && !input.readOnly) {
                        // Cancel editing
                        e.preventDefault();
                        input.value = originalName;
                        input.readOnly = true;
                        isEditing = false;
                        renameBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>`
                        renameBtn.title = 'Rename animation';
                        container.classList.remove('editing');
                    }
                })
                
                // Create delete button
                let deleteBtn = document.createElement('button')
                deleteBtn.className = 'delete-animation-btn'
                deleteBtn.innerHTML = '×'
                deleteBtn.title = 'Delete animation'
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log(this.object.animations, this.object.animations.indexOf(animation));
                    this.object.animations.splice(this.object.animations.indexOf(animation), 1)
                    console.log(this.object.animations);
                    this.updateUI();
                })
                
                container.appendChild(input)
                container.appendChild(renameBtn)
                container.appendChild(deleteBtn)
                this.$ui.appendChild(container)
            }
        }
        
        // Update animations count
        this.updateAnimationsCount()
    }
    
    updateAnimationsCount() {
        const total = this.object?.animations?.length || 0
        const visible = document.querySelectorAll('.animation-item:not(.hidden)').length
        
        if(this.$animationsSearch.value.trim()) {
            this.$animationsCount.textContent = `${visible} of ${total} animations`
        } else {
            this.$animationsCount.textContent = `${total} animation${total !== 1 ? 's' : ''}`
        }
    }
    
    onSearchAnimations(e) {
        const searchTerm = e.target.value.toLowerCase().trim()
        const items = document.querySelectorAll('.animation-item')
        let visibleCount = 0
        
        items.forEach(item => {
            const input = item.querySelector('input[type="text"]')
            const animationName = input.value.toLowerCase()
            
            if(animationName.includes(searchTerm)) {
                item.classList.remove('hidden')
                visibleCount++
            } else {
                item.classList.add('hidden')
            }
        })
        
        // Show/hide "no results" message
        let noResultsMsg = this.$ui.querySelector('.no-results-message')
        if(searchTerm && visibleCount === 0 && items.length > 0) {
            if(!noResultsMsg) {
                noResultsMsg = document.createElement('div')
                noResultsMsg.className = 'no-results-message'
                noResultsMsg.innerHTML = '🔍 No animations found<br><span style="font-size: 0.85em; opacity: 0.7;">Try a different search term</span>'
                this.$ui.appendChild(noResultsMsg)
            }
        } else if(noResultsMsg) {
            noResultsMsg.remove()
        }
        
        this.updateAnimationsCount()
    }

    onTransformModeClick(e) {
        const btn = e.currentTarget;
        const mode = btn.dataset.mode;
        
        // Update button states
        this.$transformBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Hide or show transform control
        if(mode === 'none') {
            this.transformControl.detach();
        } else {
            // Set transform control mode
            this.transformControl.setMode(mode);
            // Reattach to object if it exists
            if(this.object) {
                this.transformControl.attach(this.object);
            }
        }
    }

    onResetTransform() {
        if(!this.object) return;
        
        // Reset position, rotation, and scale to initial values
        this.object.position.set(0, 0, 0);
        this.object.rotation.set(0, 0, 0);
        this.object.scale.set(0.01, 0.01, 0.01);
        
        console.log('Model transform reset to initial state');
    }

    onResetCamera() {
        // Reset camera position to initial values
        this.camera.position.set(0, 1, 4);
        
        // Reset controls target
        this.controls.target.set(0, 0.75, 0);
        
        // Reset zoom (for orthographic cameras) or FOV (for perspective cameras)
        if(this.camera.isPerspectiveCamera) {
            this.camera.fov = 60;
            this.camera.updateProjectionMatrix();
        }
        
        // Update controls
        this.controls.update();
        
        console.log('Camera view reset to initial state');
    }

    onInPlaceToggle(e) {
        const isChecked = e.currentTarget.checked;
        
        if(!this.object || !this.object.animations || this.object.animations.length === 0) {
            return;
        }
        
        // Store original animations if not already stored
        if(!this.originalAnimations) {
            this.originalAnimations = this.object.animations.map(clip => clip.clone());
        }
        
        if(isChecked) {
            // Apply In Place to current animations
            this.object.animations = this.makeAnimationsInPlace(this.originalAnimations);
            console.log('In Place applied to preview animations');
        } else {
            // Restore original animations
            this.object.animations = this.originalAnimations.map(clip => clip.clone());
            console.log('Original animations restored');
        }
        
        // If an animation is currently playing, restart it from the beginning with the new version
        if(this.animation && this.mixer) {
            const currentClipName = this.animation.getClip().name;
            const wasPlaying = this.isPlaying;
            
            // Stop current animation
            this.animation.stop();
            
            // Find the new version of the same animation
            const newClip = this.object.animations.find(clip => clip.name === currentClipName);
            if(newClip) {
                this.animation = this.mixer.clipAction(newClip);
                this.animation.setLoop(this.isLooping ? THREE.LoopRepeat : THREE.LoopOnce);
                this.animation.timeScale = this.animationSpeed;
                this.animation.reset(); // Reset to first frame
                
                if(wasPlaying) {
                    this.animation.play();
                }
            }
        }
        
        // Update UI to reflect changes
        this.updateUI();
    }

    makeAnimationsInPlace(animations) {
        if(!animations || animations.length === 0) return animations;
        
        const processedAnimations = [];
        
        for(let clip of animations) {
            const newClip = clip.clone();
            
            // Find position tracks (usually named like "mixamorig:Hips.position" or similar)
            for(let track of newClip.tracks) {
                const trackName = track.name.toLowerCase();
                
                // Check if this is a root position track (X and Z movement)
                if(trackName.includes('position') && 
                   (trackName.includes('hips') || trackName.includes('root') || trackName.includes('pelvis'))) {
                    
                    const values = track.values;
                    const itemSize = track.getValueSize();
                    
                    if(itemSize === 3) { // Position track (x, y, z)
                        // Calculate initial position
                        const startX = values[0];
                        const startZ = values[2];
                        
                        // Remove X and Z movement, keep Y (vertical movement)
                        for(let i = 0; i < values.length; i += 3) {
                            values[i] = startX;     // X stays at start position
                            // values[i + 1] unchanged (keep Y movement for jumping, etc.)
                            values[i + 2] = startZ; // Z stays at start position
                        }
                    }
                }
            }
            
            processedAnimations.push(newClip);
        }
        
        return processedAnimations;
    }

    async exportGLB() {
        console.log('export requested');

        const gltfExporter = new GLTFExporter();
        
        // Add loading state
        this.$export.classList.add('loading');
        this.$export.disabled = true;
        const originalText = this.$export.textContent;

        // Browser fallback save functions
        function save( blob, filename ) {
            const link = document.createElement( 'a' );
            link.style.display = 'none';
            document.body.appendChild( link ); // Firefox workaround, see #6594
            link.href = URL.createObjectURL( blob );
            link.download = filename;
            link.click();
            link.remove()
        }

        function saveString( text, filename ) {
            save( new Blob( [ text ], { type: 'text/plain' } ), filename );
        }

        function saveArrayBuffer( buffer, filename ) {
            save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
        }

        const target = this.object || this.scene
        if(!target) {
            this.$export.classList.remove('loading');
            this.$export.disabled = false;
            return;
        }

        // Get custom filename or use default
        let filename = this.$filenameInput.value.trim() || 'model';
        // Remove any file extension if user added it
        filename = filename.replace(/\.(glb|gltf)$/i, '');

        // Use current animations (already processed if In Place is checked)
        let animationsToExport = target.animations || [];

        gltfExporter.parse(
            target,
            async ( result ) => {

                if ( result instanceof ArrayBuffer ) {
                    // Check if running in Electron
                    if (isElectron()) {
                        try {
                            // Convert ArrayBuffer to Blob for Electron adapter
                            const blob = new Blob([result], { type: 'application/octet-stream' });
                            
                            // Use Electron save dialog
                            const success = await adaptFileWriting(blob, filename + '.glb', {
                                filters: [
                                    { name: 'GLB Files', extensions: ['glb'] }
                                ]
                            });
                            
                            if (success) {
                                console.log('GLB file saved successfully via Electron');
                                
                                // Show success state
                                this.$export.classList.remove('loading');
                                this.$export.classList.add('success');
                                
                                // Reset after animation
                                setTimeout(() => {
                                    this.$export.classList.remove('success');
                                    this.$export.disabled = false;
                                }, 2000);
                            } else {
                                console.log('Save cancelled or failed');
                                
                                // Remove loading state
                                this.$export.classList.remove('loading');
                                this.$export.disabled = false;
                            }
                        } catch (error) {
                            console.error('Error saving file via Electron:', error);
                            
                            // Show error notification
                            alert('Failed to save file: ' + (error.message || 'Unknown error'));
                            
                            // Remove loading state
                            this.$export.classList.remove('loading');
                            this.$export.disabled = false;
                        }
                    } else {
                        // Browser fallback
                        saveArrayBuffer( result, filename + '.glb' );
                        
                        // Show success state
                        this.$export.classList.remove('loading');
                        this.$export.classList.add('success');
                        
                        // Reset after animation
                        setTimeout(() => {
                            this.$export.classList.remove('success');
                            this.$export.disabled = false;
                        }, 2000);
                    }

                } else {
                    // GLTF JSON format
                    const output = JSON.stringify( result, null, 2 );
                    console.log( output );
                    
                    if (isElectron()) {
                        try {
                            // Convert string to Blob for Electron adapter
                            const blob = new Blob([output], { type: 'text/plain' });
                            
                            // Use Electron save dialog
                            const success = await adaptFileWriting(blob, filename + '.gltf', {
                                filters: [
                                    { name: 'GLTF Files', extensions: ['gltf'] }
                                ]
                            });
                            
                            if (success) {
                                console.log('GLTF file saved successfully via Electron');
                                
                                // Show success state
                                this.$export.classList.remove('loading');
                                this.$export.classList.add('success');
                                
                                // Reset after animation
                                setTimeout(() => {
                                    this.$export.classList.remove('success');
                                    this.$export.disabled = false;
                                }, 2000);
                            } else {
                                console.log('Save cancelled or failed');
                                
                                // Remove loading state
                                this.$export.classList.remove('loading');
                                this.$export.disabled = false;
                            }
                        } catch (error) {
                            console.error('Error saving file via Electron:', error);
                            
                            // Show error notification
                            alert('Failed to save file: ' + (error.message || 'Unknown error'));
                            
                            // Remove loading state
                            this.$export.classList.remove('loading');
                            this.$export.disabled = false;
                        }
                    } else {
                        // Browser fallback
                        saveString( output, filename + '.gltf' );
                        
                        // Show success state
                        this.$export.classList.remove('loading');
                        this.$export.classList.add('success');
                        
                        // Reset after animation
                        setTimeout(() => {
                            this.$export.classList.remove('success');
                            this.$export.disabled = false;
                        }, 2000);
                    }
                }

            },
            ( error ) => {

                console.log( 'An error happened during parsing', error );
                
                // Show error notification
                if (isElectron()) {
                    alert('Export failed: ' + (error.message || 'Unknown error'));
                }
                
                // Remove loading state on error
                this.$export.classList.remove('loading');
                this.$export.disabled = false;

            },
            {
                binary: true,
                animations: animationsToExport
            }
        );
    }
    
    openSettings() {
        this.$settingsModal.style.display = 'flex';
    }
    
    closeSettings() {
        this.$settingsModal.style.display = 'none';
    }
    
    onBgColorChange(e) {
        const color = e.target.value;
        this.renderer.setClearColor(color);
        if(this.scene.fog) {
            this.scene.fog.color.set(color);
        }
    }
    
    resetBgColor() {
        const defaultColor = '#15151a';
        this.$bgColorPicker.value = defaultColor;
        this.renderer.setClearColor(defaultColor);
        if(this.scene.fog) {
            this.scene.fog.color.set(defaultColor);
        }
    }
    
    onGridColorChange(e) {
        const color = e.target.value;
        if(this.gridHelper) {
            // Update both center line color and grid color
            this.gridHelper.material.color.set(color);
            // Increase opacity to make color more visible
            this.gridHelper.material.opacity = 1;
        }
    }
    
    resetGridColor() {
        const defaultColor = '#969fbf';
        this.$gridColorPicker.value = defaultColor;
        if(this.gridHelper) {
            this.gridHelper.material.color.set(defaultColor);
            this.gridHelper.material.opacity = 1;
        }
    }
    
    onGridSizeChange(e) {
        const size = parseInt(e.target.value);
        this.$gridSizeValue.textContent = size;
        this.updateGrid(size, parseInt(this.$gridDivisionsSlider.value));
    }
    
    resetGridSize() {
        const defaultSize = 15;
        this.$gridSizeSlider.value = defaultSize;
        this.$gridSizeValue.textContent = defaultSize;
        this.updateGrid(defaultSize, parseInt(this.$gridDivisionsSlider.value));
    }
    
    onGridDivisionsChange(e) {
        const divisions = parseInt(e.target.value);
        this.$gridDivisionsValue.textContent = divisions;
        this.updateGrid(parseInt(this.$gridSizeSlider.value), divisions);
    }
    
    resetGridDivisions() {
        const defaultDivisions = 10;
        this.$gridDivisionsSlider.value = defaultDivisions;
        this.$gridDivisionsValue.textContent = defaultDivisions;
        this.updateGrid(parseInt(this.$gridSizeSlider.value), defaultDivisions);
    }
    
    updateGrid(size, divisions) {
        if(this.gridHelper) {
            this.scene.remove(this.gridHelper);
            this.gridHelper.geometry.dispose();
            this.gridHelper.material.dispose();
        }
        
        const gridColor = this.$gridColorPicker.value;
        // Use the same color for both center lines and grid lines for better visibility
        this.gridHelper = new THREE.GridHelper(size, divisions, gridColor, gridColor);
        this.gridHelper.position.y = 0;
        this.gridHelper.position.x = 0;
        this.gridHelper.material.opacity = 1;
        this.gridHelper.material.transparent = true;
        this.scene.add(this.gridHelper);
    }
    
    togglePlayPause() {
        if(!this.animation) {
            // If no animation selected, do nothing but keep button responsive
            return;
        }
        
        this.isPlaying = !this.isPlaying;
        
        if(this.isPlaying) {
            this.animation.paused = false;
        } else {
            this.animation.paused = true;
        }
        
        this.updatePlayPauseButton();
    }
    
    updatePlayPauseButton() {
        if(!this.$playPauseBtn) return;
        
        if(this.isPlaying) {
            this.$playPauseBtn.classList.add('playing');
            if(this.$playIcon) this.$playIcon.style.display = 'none';
            if(this.$pauseIcon) this.$pauseIcon.style.display = 'block';
        } else {
            this.$playPauseBtn.classList.remove('playing');
            if(this.$playIcon) this.$playIcon.style.display = 'block';
            if(this.$pauseIcon) this.$pauseIcon.style.display = 'none';
        }
    }
    
    toggleLoop() {
        this.isLooping = !this.isLooping;
        this.updateLoopButton();
        
        if(this.animation) {
            this.animation.setLoop(this.isLooping ? THREE.LoopRepeat : THREE.LoopOnce);
            
            // If loop is disabled and animation finished, reset it
            if(!this.isLooping && this.animation.time >= this.animation.getClip().duration) {
                this.animation.reset();
            }
        }
        
        this.updateLoopButton();
    }
    
    updateLoopButton() {
        if(!this.$loopBtn) return;
        
        if(this.isLooping) {
            this.$loopBtn.classList.add('active');
        } else {
            this.$loopBtn.classList.remove('active');
        }
    }
    
    updateAnimationProgress() {
        if(!this.$animCurrentTime || !this.$animTotalTime) return;
        
        // If no animation, show 0/0
        if(!this.animation) {
            this.$animCurrentTime.textContent = '0';
            this.$animTotalTime.textContent = '0';
            if(this.$animProgressBar) {
                this.$animProgressBar.style.width = '0%';
            }
            if(this.$animProgressSlider) {
                this.$animProgressSlider.value = 0;
            }
            return;
        }
        
        const currentTime = this.animation.time;
        const duration = this.animation.getClip().duration;
        
        // Check if this is a static pose (duration is 0 or very small)
        const isStaticPose = duration < 0.01;
        
        let progress = 0;
        if(isStaticPose) {
            // For static poses, show as complete (100%)
            progress = 100;
        } else {
            progress = (currentTime / duration) * 100;
        }
        
        // Update time display
        this.$animCurrentTime.textContent = Math.floor(currentTime);
        this.$animTotalTime.textContent = Math.floor(duration);
        
        // Update progress bar
        if(this.$animProgressBar) {
            this.$animProgressBar.style.width = `${Math.min(progress, 100)}%`;
        }
        
        // Update slider (only if not being dragged)
        if(this.$animProgressSlider && !this.wasPlayingBeforeScrub) {
            this.$animProgressSlider.value = progress;
        }
        
        // Check if animation finished and loop is disabled (skip for static poses)
        if(!isStaticPose && !this.isLooping && currentTime >= duration - 0.1) {
            if(this.isPlaying) {
                this.isPlaying = false;
                this.updatePlayPauseButton();
                // Reset animation to start
                this.animation.time = 0;
                this.mixer.setTime(0);
            }
        }
    }
    
    onProgressSliderChange(e) {
        if(!this.animation) {
            // Reset slider if no animation
            e.target.value = 0;
            return;
        }
        
        const progress = parseFloat(e.target.value);
        const duration = this.animation.getClip().duration;
        const newTime = (progress / 100) * duration;
        
        this.animation.time = newTime;
        this.mixer.setTime(newTime);
    }
    
    onProgressSliderMouseDown() {
        this.wasPlayingBeforeScrub = this.isPlaying;
        if(this.isPlaying) {
            this.isPlaying = false;
        }
    }
    
    onProgressSliderMouseUp() {
        if(this.wasPlayingBeforeScrub) {
            this.isPlaying = true;
        }
        this.wasPlayingBeforeScrub = false;
    }
    
    onSpeedChange(e) {
        let speed = parseFloat(e.target.value);
        
        // Clamp speed between 0.1 and 5
        if(speed < 0.1) speed = 0.1;
        if(speed > 5) speed = 5;
        
        this.animationSpeed = speed;
        e.target.value = speed.toFixed(1);
        
        // Update animation speed if animation is active
        if(this.animation) {
            this.animation.timeScale = speed;
        }
    }
    
    destroy() {
        window.removeEventListener('resize', this.resizeBind);
        window.cancelAnimationFrame(this.raf)
        this.scene = this.renderer = null    
        console.log(this.scene, this.renderer);
    }

    disposeObject(object) {
        object.traverse((child) => {
            if(child.isMesh) {
                if(child.geometry) child.geometry.dispose();
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                for(const m of mats) {
                    if(!m) continue;
                    if(m.map && m.map.dispose) m.map.dispose();
                    if(m.emissiveMap && m.emissiveMap.dispose) m.emissiveMap.dispose();
                    if(m.normalMap && m.normalMap.dispose) m.normalMap.dispose();
                    if(m.roughnessMap && m.roughnessMap.dispose) m.roughnessMap.dispose();
                    if(m.metalnessMap && m.metalnessMap.dispose) m.metalnessMap.dispose();
                    m.dispose && m.dispose();
                }
            }
        });
        if(this.mixer) { try { this.mixer.stopAllAction(); } catch{} this.mixer = null; }
    }
}

const app = new App();
app.init();

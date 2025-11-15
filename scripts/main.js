import * as THREE from 'three';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'; 
import { GLTFExporter } from './GLTFExporter.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

class App {
    constructor(m) {
    	// Get elements
        this.$canvas = document.querySelector('canvas')
        this.$source = document.getElementById('source')
        this.$animation = document.getElementById('source-animations')
        this.$textureMap = document.getElementById('texture-map')
        this.$export = document.getElementById('export-btn')
        this.$ui = document.getElementById('animations-ui')
        this.$transformBtn = document.getElementById('transform-mode-btn')
        this.$inPlaceCheckbox = document.getElementById('in-place-checkbox')
        this.$filenameInput = document.getElementById('filename-input')

        // Events
        this.$source.addEventListener('change', this.onSourceChange.bind(this))
        this.$animation.addEventListener('change', this.onAnimationChange.bind(this))
        this.$textureMap.addEventListener('change', this.onTextureChange.bind(this))

        this.$export.addEventListener('click', this.exportGLB.bind(this))
        this.$transformBtn.addEventListener('click', this.changeTransformMode.bind(this));			        
        
        this.customTexture = null;
        
        this.resize();
        this.resizeBind = this.resize.bind(this);
        window.addEventListener('resize', this.resizeBind); 
    }			    

    init() {    
        this.initRenderer();  
        this.initScene();     
        this.initLoaders();

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

        const gridHelper = new THREE.GridHelper(10,10,"#969fbf","#2a2a35");
        gridHelper.position.y = 0;
        gridHelper.position.x = 0;
        console.log(gridHelper.material);
        gridHelper.material.opacity = 0.25
        gridHelper.material.transparent = true
        this.scene.add( gridHelper );

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
        this.camera = new THREE.PerspectiveCamera(30, this.sizes.width / this.sizes.height, 0.01,100)
        this.camera.position.set(3,1,3)
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

        this.scene.fog = new THREE.Fog("#15151a", 10, 30);

        const pmrem = new THREE.PMREMGenerator(this.renderer)
        const envTex = pmrem.fromScene(new RoomEnvironment(this.renderer), 0.04).texture
        this.scene.environment = envTex
    }

    initLoaders() {
        this.fbxLoader = new FBXLoader();
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

        if(this.mixer) this.mixer.setTime(elapsedTime)

        // Call tick again on the next frame
        this.raf = window.requestAnimationFrame(this.render.bind(this))
    }

    async onSourceChange(e) {
        return new Promise(resolve => {
            const file = e.currentTarget.files[0];      

            const filename = file.name;
            const extension = filename.split( '.' ).pop().toLowerCase();
            
            // Auto-set filename from source file (without extension)
            const baseFilename = filename.replace(/\.[^/.]+$/, '');
            if(this.$filenameInput && !this.$filenameInput.value) {
                this.$filenameInput.value = baseFilename;
            }

            const reader = new FileReader();
            reader.addEventListener( 'load', ( event ) => {
                const contents = event.target.result;

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

                this.updateUI()
                this.fixNonPBRMaterials()
                
                if(this.customTexture) {
                    this.applyTextureToModel(this.customTexture);
                }
                
                this.scene.add(this.object)

                console.log(this.object); 

                this.transformControl.attach(this.object)

                resolve()

            }, { once: true } );
            reader.readAsArrayBuffer( file );
        })
    }

    async onAnimationChange(e) {
        const files = e.currentTarget.files;        

        if(!files) return;

        for(let file of files) {
            if(!this.object) {
                await this.onSourceChange(e)
            } else {                
                const reader = new FileReader();
                reader.addEventListener( 'load', ( event ) => {
                    const contents = event.target.result;

                    let object = this.fbxLoader.parse( contents );

                    if(object.animations.length) {
                        for(let animation of object.animations) {
                            animation.name = file.name.split('.')[0]
                            this.object.animations.push(animation)
                        }                        
                    }

                    this.updateUI()    
                    this.fixNonPBRMaterials()
                }, { once: true } );
                reader.readAsArrayBuffer( file );
            }        
        }

        e.currentTarget.value = ''
    }

    onTextureChange(e) {
        const file = e.currentTarget.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
            const img = new Image();
            img.onload = () => {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load(event.target.result);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.flipY = true;
                
                this.customTexture = texture;
                
                if(this.object) {
                    this.applyTextureToModel(texture);
                }
                
                console.log('Texture loaded and applied');
            };
            img.src = event.target.result;
        }, { once: true });
        reader.readAsDataURL(file);
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
            for(let animation of this.object.animations) {
                console.log(animation.name);
                let input = document.createElement('input')
                input.type = "text"
                input.value = animation.name;
                input.addEventListener('blur', () => {
                    if(this.animation) this.animation.stop();
                })
                input.addEventListener('focus', () => {
                    this.animation = this.mixer.clipAction(animation);
                    this.animation.play()
                })
                input.addEventListener('change', () => {
                    animation.name = input.value
                })
                input.addEventListener('contextmenu', (e) => {
                    e.preventDefault();            

                    console.log(this.object.animations, this.object.animations.indexOf(animation));
                    this.object.animations.splice(this.object.animations.indexOf(animation), 1)
                    console.log(this.object.animations);
                    this.updateUI();

                    return false;
                }, false);
                this.$ui.appendChild(input)
            }
        }
    }

    changeTransformMode() {
        const modes = ['translate','rotate','scale'];
        const currentMode = this.transformControl.getMode()
        const index = modes.indexOf(currentMode)
        const newMode = index < modes.length-1 ? modes[index+1] : modes[0];
        this.transformControl.setMode(newMode);
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

    exportGLB() {
        console.log('export requested');

        const gltfExporter = new GLTFExporter();

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
        if(!target) return

        // Get custom filename or use default
        let filename = this.$filenameInput.value.trim() || 'model';
        // Remove any file extension if user added it
        filename = filename.replace(/\.(glb|gltf)$/i, '');

        // Apply In Place if checkbox is checked
        let animationsToExport = target.animations || [];
        if(this.$inPlaceCheckbox && this.$inPlaceCheckbox.checked) {
            console.log('Applying In Place to animations...');
            animationsToExport = this.makeAnimationsInPlace(animationsToExport);
        }

        gltfExporter.parse(
            target,
            function ( result ) {

                if ( result instanceof ArrayBuffer ) {

                    saveArrayBuffer( result, filename + '.glb' );

                } else {

                    const output = JSON.stringify( result, null, 2 );
                    console.log( output );
                    saveString( output, filename + '.gltf' );

                }

            },
            function ( error ) {

                console.log( 'An error happened during parsing', error );

            },
            {
                binary: true,
                animations: animationsToExport
            }
        );
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

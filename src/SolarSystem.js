import * as THREE from 'three';
import {FontLoader} from "three/examples/jsm/loaders/FontLoader";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry";
import {planetThreeXYZ} from './PlanetPosition';

const AU = 10;
const ER = 0.01; // Earth Radius
const sunSize = 0.1; // Realistic 109 - number of earth radius

let font;
/**
 * Create planets and sun then save to global object
 * @param {object} scene
 * @param {object} planets
 * @param {function} render
 */
const solarSystemCreate = (scene, planets, planetlabels, planetcircles, render) => {
    let loader = new THREE.TextureLoader();
    let texture, orbitCircle, orbit;

    let fontloader = new FontLoader();

    let fontL = fontloader.load(`Metropolis Thin_Regular.json`, // onLoad callback
    function ( _font )
    {
        font = _font;

        scene.background  = loader.load(`img/stars.jpg`, render);

        solarSystemData.map(sphere => {
            texture = loader.load(`img/${sphere.name.toLowerCase()}.jpg`, render);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.matrixAutoUpdate = false;

            if (sphere.name === 'Sun')
            {
                planets[sphere.name] = new THREE.Mesh(new THREE.SphereBufferGeometry(sphere.radius, 32, 32), new THREE.MeshBasicMaterial({map: texture}));
            }
            else
            {
                planets[sphere.name] = new THREE.Mesh(new THREE.SphereBufferGeometry(sphere.radius, 32, 32), new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    specular: 0x050505,
                    shininess: 100,
                    map: texture
                }));

                // Create orbit
                const orbitGeometry = new THREE.BufferGeometry();

                let orbitVerticesArray = [];

                const unixMillisNow = (new Date().getTime());
                for(let i=0; i<128; i++)
                {
                    const tMillis = unixMillisNow + ((i/128.0) * (sphere.orbitSeconds*1000.0));
                    const xyz = planetThreeXYZ(sphere.keplerianIndex, tMillis);
                    orbitVerticesArray.push(xyz[0]*AU,xyz[1]*AU,xyz[2]*AU);
                }
                const orbitVertices = new Float32Array( orbitVerticesArray );

                // itemSize = 3 because there are 3 values (components) per vertex
                orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitVertices, 3));

                //orbitCircle = new THREE.EllipseCurve(0, 0, sphere.distance, sphere.distance, 0, 2 * Math.PI, false, 0);
                //orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitCircle.getPoints(64)), new THREE.LineBasicMaterial({color: 0x056d64}));
                orbit = new THREE.Line(orbitGeometry, new THREE.LineBasicMaterial({color: 0x056d64}));
                //orbit.rotateX(0.5 * Math.PI);
                scene.add(orbit);
            }
            planets[sphere.name].name = sphere.name;
            scene.add(planets[sphere.name]);

            /* No label for Sun */
            if(sphere.name === 'Sun') return;

            let textGeo = new TextGeometry( ` ${sphere.name}`, {
                font: font,
                size: 0.1,
                height: 0,
                curveSegments: 10
            });
            textGeo.computeBoundingBox();

            planetlabels[sphere.name] = new THREE.Mesh( textGeo, new THREE.LineBasicMaterial({color: 0xffffff}) );

            planetlabels[sphere.name].boundingBox = textGeo.boundingBox;
            planetlabels[sphere.name].position.x = planets[sphere.name].position.x;
            planetlabels[sphere.name].position.y = planets[sphere.name].position.y;
            planetlabels[sphere.name].position.z = planets[sphere.name].position.z;

            scene.add( planetlabels[sphere.name] );

            const circleHalfGap = 0.4;
            let labelCircleCurve = new THREE.EllipseCurve(planets[sphere.name].position.x, planets[sphere.name].position.y, 5*ER, 5*ER, (Math.PI/2.0)+circleHalfGap, ((3.0*Math.PI)/2.0)-circleHalfGap, false, 0);
            let labelCircleCurve2 = new THREE.EllipseCurve(planets[sphere.name].position.x, planets[sphere.name].position.y, 5*ER, 5*ER, ((3.0*Math.PI)/2.0)+circleHalfGap, (Math.PI/2.0)-circleHalfGap, false, 0);
            planetcircles[sphere.name] = {
                'curveA': new THREE.Line(new THREE.BufferGeometry().setFromPoints(labelCircleCurve.getPoints(32)), new THREE.LineBasicMaterial({color: 0xffffff})),
                'curveB': new THREE.Line(new THREE.BufferGeometry().setFromPoints(labelCircleCurve2.getPoints(32)), new THREE.LineBasicMaterial({color: 0xffffff}))
            };

            scene.add(planetcircles[sphere.name]['curveA']);
            scene.add(planetcircles[sphere.name]['curveB']);
        });
    });

    //let axesHelper = new THREE.AxesHelper( 5 );
    //scene.add( axesHelper );
};

/**
 * Map all planets and  change it position, rotation etc.
 * @param {object} planets
 */
const solarSystemMove = (planets) => {
    const unixMillisNow = (new Date().getTime());
    solarSystemData.map(sphere => {
        sphere.orbit += sphere.lineSpeed * 0.01;

        planets[sphere.name].rotateY(sphere.rotate);

        if(sphere.keplerianIndex >= 0)
        {
            const xyz = planetThreeXYZ(sphere.keplerianIndex, unixMillisNow);

            planets[sphere.name].position.x = xyz[0] * AU;
            planets[sphere.name].position.y = xyz[1] * AU;
            planets[sphere.name].position.z = xyz[2] * AU;
        }
    });
};

const planetLabelsMove = (planets, planetlabels, planetcircles, camera) =>
{
    solarSystemData.map(sphere =>
    {
        if(sphere.name === 'Sun') return;

        planetlabels[sphere.name].position.x = planets[sphere.name].position.x;
        planetlabels[sphere.name].position.y = planets[sphere.name].position.y + 0.2;
        planetlabels[sphere.name].position.z = planets[sphere.name].position.z;

        planetlabels[sphere.name].rotation.x = camera.rotation.x;
        planetlabels[sphere.name].rotation.y = camera.rotation.y;
        planetlabels[sphere.name].rotation.z = camera.rotation.z;

        planetcircles[sphere.name]['curveA'].position.x = planets[sphere.name].position.x;
        planetcircles[sphere.name]['curveA'].position.y = planets[sphere.name].position.y;
        planetcircles[sphere.name]['curveA'].position.z = planets[sphere.name].position.z;

        planetcircles[sphere.name]['curveA'].rotation.x = camera.rotation.x;
        planetcircles[sphere.name]['curveA'].rotation.y = camera.rotation.y;
        planetcircles[sphere.name]['curveA'].rotation.z = camera.rotation.z;

        planetcircles[sphere.name]['curveB'].position.x = planets[sphere.name].position.x;
        planetcircles[sphere.name]['curveB'].position.y = planets[sphere.name].position.y;
        planetcircles[sphere.name]['curveB'].position.z = planets[sphere.name].position.z;

        planetcircles[sphere.name]['curveB'].rotation.x = camera.rotation.x;
        planetcircles[sphere.name]['curveB'].rotation.y = camera.rotation.y;
        planetcircles[sphere.name]['curveB'].rotation.z = camera.rotation.z;
    });
};

/**
 * Main object with data about all sphere in our solar system
 * @type {[object]}
 */
const solarSystemData = [
    {
        name: 'Sun',
        keplerianIndex: -1,
        radius: sunSize,
        distance: 0,
        rotate: 0.01,
        orbit: 2 * Math.PI * AU * AU,
        orbitSeconds: 0,
        lineSpeed: 0
    },
    {
        name: 'Mercury',
        keplerianIndex: 0,
        radius: 0.38 * ER,
        distance: sunSize + (0.387 * AU),
        rotate: 0.01,
        orbit: 2 * Math.PI * AU * AU,
        orbitSeconds: (88 * 24 * 3600),
        lineSpeed: (2 * Math.PI / 240) * AU,
    },
    {
        name: 'Venus',
        keplerianIndex: 1,
        radius: 0.94 * ER,
        distance: sunSize + (0.72 * AU),
        rotate: 0.005,
        orbit: 2 * Math.PI * AU * AU,
        orbitSeconds: (224.7 * 24 * 3600),
        lineSpeed: (2 * Math.PI / 610) * AU,
    },
    {
        name: 'Earth',
        keplerianIndex: 2,
        radius: ER,
        distance: sunSize + AU,
        rotate: 0.02,
        orbit: 2 * Math.PI * AU * AU,
        orbitSeconds: (365.2 * 24 * 3600),
        lineSpeed: (2 * Math.PI / 1000) * AU,
    },
    {
        name: 'Mars',
        keplerianIndex: 3,
        radius: 0.53 * ER,
        distance: sunSize + (1.523 * AU),
        rotate: 0.01,
        orbit: 2 * Math.PI * AU * AU,
        orbitSeconds: (687 * 24 * 3600),
        lineSpeed: (2 * Math.PI / 1880) * AU,
    }
/*
,
    {
        name: 'Jupiter',
        radius: 11.2 * ER,
        distance: sunSize + (5.2 * AU),
        rotate: 0.09,
        orbit: 2 * Math.PI * AU * AU,
        lineSpeed: (2 * Math.PI / 11000) * AU,
    },
    {
        name: 'Saturn',
        radius: 9.45 * ER,
        distance: sunSize + (9.53 * AU),
        rotate: 0.01,
        orbit: 2 * Math.PI * AU * AU,
        lineSpeed: (2 * Math.PI / 29440) * AU,
    },
    {
        name: 'Uranus',
        radius: 4 * ER,
        distance: sunSize + (19.19 * AU),
        rotate: 0.01,
        orbit: 2 * Math.PI * AU * AU,
        lineSpeed: (2 * Math.PI / 84070) * AU,
    },
    {
        name: 'Neptune',
        radius: 3.88 * ER,
        distance: sunSize + (30.06 * AU),
        rotate: 0.01,
        orbit: 2 * Math.PI * AU * AU,
        lineSpeed: (2 * Math.PI / 164870) * AU,
    }
*/
];

function numlp(num, decimals, leading=0, leadingChar='0')
{
  const t = Math.pow(10, decimals);
  return ((Math.round((num * t) + (decimals>0?1:0)*(Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals)).toString().padStart(leading+1+decimals, leadingChar);
}


export {solarSystemCreate, solarSystemMove, planetLabelsMove}
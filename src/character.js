import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { createRagdoll } from './ragdoll.js';

export class Character {
	constructor(world, scene, position = new THREE.Vector3(0, 0, 0)) {
		this.world = world;
		this.scene = scene;
		this.characterGroup = new THREE.Group();
		this.mixer = null;
		this.walkAction = null;
		this.punchAction = null;
		this.walkClip = null;
		this.punchClip = null;
		this.ragdollBodies = null;
		this.modelBones = {};
		this.isRagdoll = false;
		this.isMoving = false;
		this.targetPosition = new THREE.Vector3();

		// Create physics body
		this.walkingBody = new CANNON.Body({
			mass: 50,
			position: new CANNON.Vec3(position.x, position.y, position.z),
			shape: new CANNON.Box(new CANNON.Vec3(0.125, 0.25, 0.125)),
			material: new CANNON.Material({ friction: 0.1, restitution: 0.1 }),
		});

		this.walkingBody.fixedRotation = true;
		this.walkingBody.angularDamping = 0.9;
		this.walkingBody.linearDamping = 0.5;
		this.walkingBody.type = CANNON.Body.KINEMATIC;

		this.world.addBody(this.walkingBody);
		this.scene.add(this.characterGroup);

		// Initialize character
		this.init();
	}

	async init() {
		// Define bone mapping
		this.bodyToBonesMap = {
			0: ['mixamorigLeftLeg'],
			1: ['mixamorigRightLeg'],
			2: ['mixamorigLeftUpLeg'],
			3: ['mixamorigRightUpLeg'],
			4: ['mixamorigHips'],
			5: ['mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2'],
			6: ['mixamorigHead'],
			7: ['mixamorigLeftArm'],
			8: ['mixamorigRightArm'],
			9: ['mixamorigLeftForeArm'],
			10: ['mixamorigRightForeArm'],
		};

		// Create ragdoll
		const ragdoll = createRagdoll(
			1,
			this.walkingBody.position.clone(),
			Math.PI / 6,
			Math.PI / 4,
			Math.PI / 8,
		);
		this.ragdollBodies = ragdoll.bodies;
		this.ragdollConstraints = ragdoll.constraints;

		// Load model and animations
		await this.loadModel();
	}

	async loadModel() {
		return new Promise((resolve, reject) => {
			const fbxLoader = new FBXLoader();
			fbxLoader.load(
				'assets/Walking.fbx',
				async (model) => {
					this.model = model;
					this.model.scale.setScalar(0.025);
					this.characterGroup.add(this.model);

					// Store bones
					this.model.traverse((node) => {
						if (node.isBone) {
							this.modelBones[node.name.toLowerCase()] = node;
						}
					});

					// Setup animations
					this.mixer = new THREE.AnimationMixer(this.model);
					await this.setupAnimations();
					resolve();
				},
				undefined,
				reject,
			);
		});
	}

	async setupAnimations() {
		this.walkClip = this.model.animations[0];
		this.punchClip = await this.loadAnimation('assets/Punching.fbx');

		// Clean animations
		const cleanWalkClip = this.cleanAnimation(this.walkClip);
		const cleanPunchClip = this.cleanAnimation(this.punchClip);

		// Create actions
		this.walkAction = this.mixer.clipAction(cleanWalkClip);
		this.punchAction = this.mixer.clipAction(cleanPunchClip);

		this.walkAction.enabled = false;
		this.punchAction.enabled = false;
		this.punchAction.loop = THREE.LoopRepeat;

		this.walkAction.clampWhenFinished = true;
		this.punchAction.clampWhenFinished = true;
	}

	async loadAnimation(filename) {
		return new Promise((resolve, reject) => {
			const fbxLoader = new FBXLoader();
			fbxLoader.load(
				filename,
				(fbx) => resolve(fbx.animations[0]),
				undefined,
				reject,
			);
		});
	}

	cleanAnimation(clip) {
		const cleanClip = THREE.AnimationClip.parse(
			THREE.AnimationClip.toJSON(clip),
		);
		cleanClip.tracks = cleanClip.tracks.filter(
			(track) =>
				!track.name.toLowerCase().includes('position') &&
				!track.name.toLowerCase().includes('translation'),
		);
		return cleanClip;
	}

	enableRagdoll() {
		if (this.isRagdoll) return;
		this.isRagdoll = true;

		if (this.walkAction) this.walkAction.stop();
		if (this.punchAction) this.punchAction.stop();

		this.world.removeBody(this.walkingBody);

		this.ragdollBodies.forEach((body) => {
			body.wakeUp();
			body.type = CANNON.Body.DYNAMIC;

			const bone =
				this.modelBones[
					this.bodyToBonesMap[this.ragdollBodies.indexOf(body)][0].toLowerCase()
				];
			if (bone) {
				const worldPosition = new THREE.Vector3();
				const worldQuaternion = new THREE.Quaternion();
				bone.getWorldPosition(worldPosition);
				bone.getWorldQuaternion(worldQuaternion);

				body.position.copy(worldPosition);
				body.quaternion.copy(worldQuaternion);
				body.velocity.set(
					(Math.random() - 0.5) * 2,
					0,
					(Math.random() - 0.5) * 2,
				);
			}
		});
	}

	switchAnimation(from, to, duration = 0.2) {
		if (!from || !to) return;
		to.enabled = true;
		to.setEffectiveTimeScale(1);
		to.setEffectiveWeight(1);
		to.crossFadeFrom(from, duration, true);
		to.play();
	}

	switchToPunch() {
		this.switchAnimation(this.walkAction, this.punchAction);
	}

	switchToWalk() {
		this.switchAnimation(this.punchAction, this.walkAction);
	}

	moveTo(targetPos) {
		this.targetPosition.copy(targetPos);
		this.isMoving = true;
	}

	update(deltaTime) {
		if (!this.isRagdoll) {
			if (this.isMoving) {
				const currentPosition = new THREE.Vector3(
					this.walkingBody.position.x,
					0,
					this.walkingBody.position.z,
				);
				const direction = new THREE.Vector3()
					.subVectors(this.targetPosition, currentPosition)
					.normalize();

				const distance = currentPosition.distanceTo(this.targetPosition);

				if (distance > 1) {
					const maxSpeed = 20;
					const targetVelocity = new CANNON.Vec3(
						direction.x * maxSpeed,
						0,
						direction.z * maxSpeed,
					);

					this.walkingBody.velocity.copy(targetVelocity);
					this.characterGroup.rotation.y = Math.atan2(direction.x, direction.z);

					if (this.walkAction && !this.walkAction.isRunning()) {
						this.switchToWalk();
						this.walkAction.timeScale = 1.5;
					}
				} else {
					this.walkingBody.velocity.set(0, 0, 0);
					this.isMoving = false;

					if (this.punchAction) {
						this.switchToPunch();
					}
				}
			}

			this.characterGroup.position.copy(this.walkingBody.position);
		} else {
			this.updateRagdollPhysics();
		}

		if (this.mixer) {
			this.mixer.update(deltaTime);
		}
	}

	updateRagdollPhysics() {
		if (!this.isRagdoll) return;

		this.ragdollBodies.forEach((body, i) => {
			const boneNames = this.bodyToBonesMap[i] || [];
			boneNames.forEach((boneName) => {
				const bone = this.modelBones[boneName.toLowerCase()];
				if (bone) {
					bone.position.copy(body.position);
					bone.quaternion.copy(body.quaternion);
				}
			});
		});
	}

	destroy() {
		this.world.removeBody(this.walkingBody);
		this.scene.remove(this.characterGroup);
		this.ragdollBodies.forEach((body) => this.world.removeBody(body));
		this.ragdollConstraints.forEach((constraint) =>
			this.world.removeConstraint(constraint),
		);
	}
}

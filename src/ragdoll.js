import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export function createRagdoll(
	scale = 10,
	position = new CANNON.Vec3(0, 0, 10),
	angleA = Math.PI / 4,
	angleB = Math.PI / 3,
	twistAngle = Math.PI / 8,
) {
	const bodies = [];
	const constraints = [];
	const group = new THREE.Group();

	const shouldersDistance = 0.5 * scale;
	const upperArmLength = 0.4 * scale;
	const lowerArmLength = 0.4 * scale;
	const upperArmSize = 0.2 * scale;
	const lowerArmSize = 0.2 * scale;
	const neckLength = 0.1 * scale;
	const headRadius = 0.25 * scale;
	const upperBodyLength = 0.6 * scale;
	const pelvisLength = 0.4 * scale;
	const upperLegLength = 0.5 * scale;
	const upperLegSize = 0.2 * scale;
	const lowerLegSize = 0.2 * scale;
	const lowerLegLength = 0.5 * scale;

	// Lower legs
	const lowerLeftLeg = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(-shouldersDistance / 2, lowerLegLength / 2, 0),
	});
	const lowerRightLeg = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(shouldersDistance / 2, lowerLegLength / 2, 0),
	});
	lowerLeftLeg.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				lowerLegSize * 0.5,
				lowerLegLength * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	lowerRightLeg.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				lowerLegSize * 0.5,
				lowerLegLength * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	bodies.push(lowerLeftLeg, lowerRightLeg);

	// Upper legs
	const upperLeftLeg = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			-shouldersDistance / 2,
			lowerLeftLeg.position.y + lowerLegLength / 2 + upperLegLength / 2,
			0,
		),
	});
	const upperRightLeg = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			shouldersDistance / 2,
			lowerRightLeg.position.y + lowerLegLength / 2 + upperLegLength / 2,
			0,
		),
	});
	upperLeftLeg.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				upperLegSize * 0.5,
				upperLegLength * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	upperRightLeg.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				upperLegSize * 0.5,
				upperLegLength * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	bodies.push(upperLeftLeg, upperRightLeg);

	// Pelvis
	const pelvis = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			0,
			upperLeftLeg.position.y + upperLegLength / 2 + pelvisLength / 2,
			0,
		),
	});
	pelvis.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				shouldersDistance * 0.5,
				pelvisLength * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	bodies.push(pelvis);

	// Upper body
	const upperBody = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			0,
			pelvis.position.y + pelvisLength / 2 + upperBodyLength / 2,
			0,
		),
	});
	upperBody.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				shouldersDistance * 0.5,
				upperBodyLength * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	bodies.push(upperBody);

	// Head
	const head = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			0,
			upperBody.position.y + upperBodyLength / 2 + headRadius + neckLength,
			0,
		),
	});
	head.addShape(new CANNON.Sphere(headRadius));
	bodies.push(head);

	// Upper arms
	const upperLeftArm = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			-shouldersDistance / 2 - upperArmLength / 2,
			upperBody.position.y + upperBodyLength / 2,
			0,
		),
	});
	const upperRightArm = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			shouldersDistance / 2 + upperArmLength / 2,
			upperBody.position.y + upperBodyLength / 2,
			0,
		),
	});
	upperLeftArm.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				upperArmLength * 0.5,
				upperArmSize * 0.5,
				upperArmSize * 0.5,
			),
		),
	);
	upperRightArm.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				upperArmLength * 0.5,
				upperArmSize * 0.5,
				upperArmSize * 0.5,
			),
		),
	);
	bodies.push(upperLeftArm, upperRightArm);

	// Lower arms
	const lowerLeftArm = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			upperLeftArm.position.x - lowerArmLength / 2 - upperArmLength / 2,
			upperLeftArm.position.y,
			0,
		),
	});
	const lowerRightArm = new CANNON.Body({
		mass: 1,
		position: new CANNON.Vec3(
			upperRightArm.position.x + lowerArmLength / 2 + upperArmLength / 2,
			upperRightArm.position.y,
			0,
		),
	});
	lowerLeftArm.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				lowerArmLength * 0.5,
				lowerArmSize * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	lowerRightArm.addShape(
		new CANNON.Box(
			new CANNON.Vec3(
				lowerArmLength * 0.5,
				lowerArmSize * 0.5,
				lowerArmSize * 0.5,
			),
		),
	);
	bodies.push(lowerLeftArm, lowerRightArm);

	// Create joints
	// Neck joint
	const neckJoint = new CANNON.ConeTwistConstraint(head, upperBody, {
		pivotA: new CANNON.Vec3(0, -headRadius - neckLength / 2, 0),
		pivotB: new CANNON.Vec3(0, upperBodyLength / 2, 0),
		axisA: CANNON.Vec3.UNIT_Y,
		axisB: CANNON.Vec3.UNIT_Y,
		angle: angleA,
		twistAngle: twistAngle,
	});
	constraints.push(neckJoint);

	// Knee joints
	const leftKneeJoint = new CANNON.ConeTwistConstraint(
		lowerLeftLeg,
		upperLeftLeg,
		{
			pivotA: new CANNON.Vec3(0, lowerLegLength / 2, 0),
			pivotB: new CANNON.Vec3(0, -upperLegLength / 2, 0),
			axisA: CANNON.Vec3.UNIT_Y,
			axisB: CANNON.Vec3.UNIT_Y,
			angle: angleA,
			twistAngle: twistAngle,
		},
	);
	const rightKneeJoint = new CANNON.ConeTwistConstraint(
		lowerRightLeg,
		upperRightLeg,
		{
			pivotA: new CANNON.Vec3(0, lowerLegLength / 2, 0),
			pivotB: new CANNON.Vec3(0, -upperLegLength / 2, 0),
			axisA: CANNON.Vec3.UNIT_Y,
			axisB: CANNON.Vec3.UNIT_Y,
			angle: angleA,
			twistAngle: twistAngle,
		},
	);
	constraints.push(leftKneeJoint, rightKneeJoint);

	// Hip joints
	const leftHipJoint = new CANNON.ConeTwistConstraint(upperLeftLeg, pelvis, {
		pivotA: new CANNON.Vec3(0, upperLegLength / 2, 0),
		pivotB: new CANNON.Vec3(-shouldersDistance / 2, -pelvisLength / 2, 0),
		axisA: CANNON.Vec3.UNIT_Y,
		axisB: CANNON.Vec3.UNIT_Y,
		angle: angleA,
		twistAngle: twistAngle,
	});
	const rightHipJoint = new CANNON.ConeTwistConstraint(upperRightLeg, pelvis, {
		pivotA: new CANNON.Vec3(0, upperLegLength / 2, 0),
		pivotB: new CANNON.Vec3(shouldersDistance / 2, -pelvisLength / 2, 0),
		axisA: CANNON.Vec3.UNIT_Y,
		axisB: CANNON.Vec3.UNIT_Y,
		angle: angleA,
		twistAngle: twistAngle,
	});
	constraints.push(leftHipJoint, rightHipJoint);

	// Spine
	const spineJoint = new CANNON.ConeTwistConstraint(pelvis, upperBody, {
		pivotA: new CANNON.Vec3(0, pelvisLength / 2, 0),
		pivotB: new CANNON.Vec3(0, -upperBodyLength / 2, 0),
		axisA: CANNON.Vec3.UNIT_Y,
		axisB: CANNON.Vec3.UNIT_Y,
		angle: angleA,
		twistAngle: twistAngle,
	});
	constraints.push(spineJoint);

	// Shoulders
	const leftShoulder = new CANNON.ConeTwistConstraint(upperBody, upperLeftArm, {
		pivotA: new CANNON.Vec3(-shouldersDistance / 2, upperBodyLength / 2, 0),
		pivotB: new CANNON.Vec3(upperArmLength / 2, 0, 0),
		axisA: CANNON.Vec3.UNIT_X,
		axisB: CANNON.Vec3.UNIT_X,
		angle: angleB,
		twistAngle: twistAngle,
	});
	const rightShoulder = new CANNON.ConeTwistConstraint(
		upperBody,
		upperRightArm,
		{
			pivotA: new CANNON.Vec3(shouldersDistance / 2, upperBodyLength / 2, 0),
			pivotB: new CANNON.Vec3(-upperArmLength / 2, 0, 0),
			axisA: CANNON.Vec3.UNIT_X,
			axisB: CANNON.Vec3.UNIT_X,
			angle: angleB,
			twistAngle: twistAngle,
		},
	);
	constraints.push(leftShoulder, rightShoulder);

	// Elbow joints
	const leftElbowJoint = new CANNON.ConeTwistConstraint(
		lowerLeftArm,
		upperLeftArm,
		{
			pivotA: new CANNON.Vec3(lowerArmLength / 2, 0, 0),
			pivotB: new CANNON.Vec3(-upperArmLength / 2, 0, 0),
			axisA: CANNON.Vec3.UNIT_X,
			axisB: CANNON.Vec3.UNIT_X,
			angle: angleA,
			twistAngle: twistAngle,
		},
	);
	const rightElbowJoint = new CANNON.ConeTwistConstraint(
		lowerRightArm,
		upperRightArm,
		{
			pivotA: new CANNON.Vec3(-lowerArmLength / 2, 0, 0),
			pivotB: new CANNON.Vec3(upperArmLength / 2, 0, 0),
			axisA: CANNON.Vec3.UNIT_X,
			axisB: CANNON.Vec3.UNIT_X,
			angle: angleA,
			twistAngle: twistAngle,
		},
	);
	constraints.push(leftElbowJoint, rightElbowJoint);

	// Move all body parts to final position
	bodies.forEach((body) => {
		body.position.set(
			position.x + body.position.x,
			position.y + body.position.y,
			position.z + body.position.z,
		);
	});

	return {
		bodies,
		constraints,
		group,
	};
}

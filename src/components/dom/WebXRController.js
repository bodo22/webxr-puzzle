import { Group, Vector3 } from 'three';

const _moveEvent = { type: 'move' };

const jointNames = [
	{ jointName: 'wrist' },
	{ jointName: 'thumb-metacarpal' },
	{ jointName: 'thumb-phalanx-proximal' },
	{ jointName: 'thumb-phalanx-distal' },
	{ jointName: 'thumb-tip' },
	{ jointName: 'index-finger-metacarpal' },
	{ jointName: 'index-finger-phalanx-proximal' },
	{ jointName: 'index-finger-phalanx-intermediate' },
	{ jointName: 'index-finger-phalanx-distal' },
	{ jointName: 'index-finger-tip' },
	{ jointName: 'middle-finger-metacarpal' },
	{ jointName: 'middle-finger-phalanx-proximal' },
	{ jointName: 'middle-finger-phalanx-intermediate' },
	{ jointName: 'middle-finger-phalanx-distal' },
	{ jointName: 'middle-finger-tip' },
	{ jointName: 'ring-finger-metacarpal' },
	{ jointName: 'ring-finger-phalanx-proximal' },
	{ jointName: 'ring-finger-phalanx-intermediate' },
	{ jointName: 'ring-finger-phalanx-distal' },
	{ jointName: 'ring-finger-tip' },
	{ jointName: 'pinky-finger-metacarpal' },
	{ jointName: 'pinky-finger-phalanx-proximal' },
	{ jointName: 'pinky-finger-phalanx-intermediate' },
	{ jointName: 'pinky-finger-phalanx-distal' },
	{ jointName: 'pinky-finger-tip' },
];


class WebXRController {

	constructor() {

		this._targetRay = null;
		this._grip = null;
		this._hand = null;

	}

	getHandSpace() {

		if ( this._hand === null ) {

			this._hand = new Group();
			this._hand.matrixAutoUpdate = false;
			this._hand.visible = false;

			this._hand.joints = {};
			this._hand.inputState = { pinching: false };

		}

		return this._hand;

	}

	getTargetRaySpace() {

		if ( this._targetRay === null ) {

			this._targetRay = new Group();
			this._targetRay.matrixAutoUpdate = false;
			this._targetRay.visible = false;
			this._targetRay.hasLinearVelocity = false;
			this._targetRay.linearVelocity = new Vector3();
			this._targetRay.hasAngularVelocity = false;
			this._targetRay.angularVelocity = new Vector3();

		}

		return this._targetRay;

	}

	getGripSpace() {

		if ( this._grip === null ) {

			this._grip = new Group();
			this._grip.matrixAutoUpdate = false;
			this._grip.visible = false;
			this._grip.hasLinearVelocity = false;
			this._grip.linearVelocity = new Vector3();
			this._grip.hasAngularVelocity = false;
			this._grip.angularVelocity = new Vector3();

		}

		return this._grip;

	}

	dispatchEvent( event ) {

		if ( this._targetRay !== null ) {

			this._targetRay.dispatchEvent( event );

		}

		if ( this._grip !== null ) {

			this._grip.dispatchEvent( event );

		}

		if ( this._hand !== null ) {

			this._hand.dispatchEvent( event );

		}

		return this;

	}

	connect( inputSource ) {

		if ( inputSource && inputSource.hand ) {

			const hand = this._hand;

			if ( hand ) {

				for ( const inputjoint of inputSource.hand.values() ) {

					// Initialize hand with joints when connected
					this._getHandJoint( hand, inputjoint );

				}

			}

		}

		this.dispatchEvent( { type: 'connected', data: inputSource } );

		return this;

	}

	disconnect( inputSource ) {

		this.dispatchEvent( { type: 'disconnected', data: inputSource } );

		if ( this._targetRay !== null ) {

			this._targetRay.visible = false;

		}

		if ( this._grip !== null ) {

			this._grip.visible = false;

		}

		if ( this._hand !== null ) {

			this._hand.visible = false;

		}

		return this;

	}

	update( inputSource, frame, referenceSpace, managedHandsJointData ) {
		console.log('update', inputSource, frame, referenceSpace, managedHandsJointData);
		let inputPose = null;
		let gripPose = null;
		let handPose = null;

		const targetRay = this._targetRay;
		const grip = this._grip;
		const hand = this._hand;
		const remote = this.remote;

		if ( inputSource && frame.session.visibilityState !== 'visible-blurred' ) {

			if ( hand && inputSource.hand ) {

				handPose = true;

				const frameJointPoses = {};
				let i = 0;
				// TODO event to take over this for loop manually or copy this whole thing to own project
				// and overwrite native three.js controller initially, similar to three-mesh-bvh
				for ( const inputjoint of inputSource.hand.values() ) {

					// Update the joints groups with the XRJoint poses
					const jointPose = frame.getJointPose( inputjoint, referenceSpace );

					// The transform of this joint will be updated with the joint pose on each frame
					const joint = this._getHandJoint( hand, inputjoint );
					// if ( loggedFrames < 900 ) {
					// 	frameJointPoses[inputjoint.jointName] = {
					// 		transformMatrix: [...jointPose.transform.matrix],
					// 		radius: jointPose.radius,
					// 	}
					// }
					if ( jointPose !== null ) {

						joint.matrix.fromArray( jointPose.transform.matrix );
						joint.matrix.decompose( joint.position, joint.rotation, joint.scale );
						joint.jointRadius = jointPose.radius;

						// frameJointPoses[ inputjoint.jointName ] = jointPose;
						if ( ! remote ) {

							frameJointPoses[ i ] = {
								transformMatrix: [ ...jointPose.transform.matrix ].map(
									( v ) => Math.round( v * 1000 ) / 1000
								  ),
								radius: Math.round( jointPose.radius * 1000 ) / 1000,
							};

						}

					}

					joint.visible = jointPose !== null;
					i ++;

				}

				if ( Object.keys( frameJointPoses ).length > 0 && managedHandsJointData ) {

					managedHandsJointData[ inputSource.handedness ] = frameJointPoses;
					// this.dispatchEvent( { type: 'frameJointPoses', frameJointPoses } );

				}
				// if (loggedFrames < 900) {
				// 	loggedFrames += 1;
				// 	data[inputSource.handedness].push(frameJointPoses)
				// 	console.log(inputSource.handedness, frameJointPoses);
				// } else if (loggedFrames === 900) {
				// 	loggedFrames += 1;
				// 	console.log(data);
				// }

				// Custom events

				// Check pinchz
				const indexTip = hand.joints[ 'index-finger-tip' ];
				const thumbTip = hand.joints[ 'thumb-tip' ];
				const distance = indexTip.position.distanceTo( thumbTip.position );

				const distanceToPinch = 0.05;
				const threshold = 0.005;

				if ( hand.inputState.pinching && distance > distanceToPinch + threshold ) {

					hand.inputState.pinching = false;
					this.dispatchEvent( {
						type: 'pinchend',
						handedness: inputSource.handedness,
						target: this
					} );

				} else if ( ! hand.inputState.pinching && distance <= distanceToPinch - threshold ) {

					hand.inputState.pinching = true;
					this.dispatchEvent( {
						type: 'pinchstart',
						handedness: inputSource.handedness,
						target: this
					} );

				}

			} else {

				if ( grip !== null && inputSource.gripSpace ) {

					gripPose = frame.getPose( inputSource.gripSpace, referenceSpace );

					if ( gripPose !== null ) {

						grip.matrix.fromArray( gripPose.transform.matrix );
						grip.matrix.decompose( grip.position, grip.rotation, grip.scale );

						if ( gripPose.linearVelocity ) {

							grip.hasLinearVelocity = true;
							grip.linearVelocity.copy( gripPose.linearVelocity );

						} else {

							grip.hasLinearVelocity = false;

						}

						if ( gripPose.angularVelocity ) {

							grip.hasAngularVelocity = true;
							grip.angularVelocity.copy( gripPose.angularVelocity );

						} else {

							grip.hasAngularVelocity = false;

						}

					}

				}

			}

			if ( targetRay !== null ) {

				inputPose = frame.getPose( inputSource.targetRaySpace, referenceSpace );

				// Some runtimes (namely Vive Cosmos with Vive OpenXR Runtime) have only grip space and ray space is equal to it
				if ( inputPose === null && gripPose !== null ) {

					inputPose = gripPose;

				}

				if ( inputPose !== null ) {

					targetRay.matrix.fromArray( inputPose.transform.matrix );
					targetRay.matrix.decompose( targetRay.position, targetRay.rotation, targetRay.scale );

					if ( inputPose.linearVelocity ) {

						targetRay.hasLinearVelocity = true;
						targetRay.linearVelocity.copy( inputPose.linearVelocity );

					} else {

						targetRay.hasLinearVelocity = false;

					}

					if ( inputPose.angularVelocity ) {

						targetRay.hasAngularVelocity = true;
						targetRay.angularVelocity.copy( inputPose.angularVelocity );

					} else {

						targetRay.hasAngularVelocity = false;

					}

					this.dispatchEvent( _moveEvent );

				}

			}


		}

		if ( targetRay !== null ) {

			targetRay.visible = ( inputPose !== null );

		}

		if ( grip !== null ) {

			grip.visible = ( gripPose !== null );

		}

		if ( hand !== null ) {

			hand.visible = ( handPose !== null );

		}

		return this;

	}

	// private method

	_getHandJoint( hand, inputjointOrIndex ) {

		const inputjoint = ! this.remote ? inputjointOrIndex : jointNames[ inputjointOrIndex ];
		if ( hand.joints[ inputjoint.jointName ] === undefined ) {

			const joint = new Group();
			joint.matrixAutoUpdate = false;
			joint.visible = false;
			hand.joints[ inputjoint.jointName ] = joint;

			hand.add( joint );

		}

		return hand.joints[ inputjoint.jointName ];

	}

}

function update( inputSource, frame, referenceSpace, managedHandsJointData ) {
	// console.log('update', inputSource, frame, referenceSpace, managedHandsJointData);
	let inputPose = null;
	let gripPose = null;
	let handPose = null;

	const targetRay = this._targetRay;
	const grip = this._grip;
	const hand = this._hand;
	const remote = this.remote;

	if ( inputSource && frame.session.visibilityState !== 'visible-blurred' ) {

		if ( hand && inputSource.hand ) {

			handPose = true;

			const frameJointPoses = {};
			let i = 0;
			
			// this.dispatchEvent( { type: 'frameJointPoses', hand: inputSource.hand } );

			// TODO event to take over this for loop manually or copy this whole thing to own project
			// and overwrite native three.js controller initially, similar to three-mesh-bvh
			
			
			for ( const inputjoint of inputSource.hand.values() ) {
				if ( ! remote ) {
					break;
				}

				// Update the joints groups with the XRJoint poses
				const jointPose = frame.getJointPose( inputjoint, referenceSpace );

				// The transform of this joint will be updated with the joint pose on each frame
				const joint = this._getHandJoint( hand, inputjoint );
				// if ( loggedFrames < 900 ) {
				// 	frameJointPoses[inputjoint.jointName] = {
				// 		transformMatrix: [...jointPose.transform.matrix],
				// 		radius: jointPose.radius,
				// 	}
				// }
				if ( jointPose !== null ) {

					joint.matrix.fromArray( jointPose.transform.matrix );
					joint.matrix.decompose( joint.position, joint.rotation, joint.scale );
					joint.jointRadius = jointPose.radius;

					// frameJointPoses[ inputjoint.jointName ] = jointPose;
					if ( ! remote ) {

						frameJointPoses[ i ] = {
							transformMatrix: [ ...jointPose.transform.matrix ].map(
								( v ) => Math.round( v * 1000 ) / 1000
							  ),
							radius: Math.round( jointPose.radius * 1000 ) / 1000,
						};

					}

				}

				joint.visible = jointPose !== null;
				i ++;

			}

			


			// if (loggedFrames < 900) {
			// 	loggedFrames += 1;
			// 	data[inputSource.handedness].push(frameJointPoses)
			// 	console.log(inputSource.handedness, frameJointPoses);
			// } else if (loggedFrames === 900) {
			// 	loggedFrames += 1;
			// 	console.log(data);
			// }

			// Custom events

			// Check pinchz
			const indexTip = hand.joints[ 'index-finger-tip' ];
			const thumbTip = hand.joints[ 'thumb-tip' ];
			const distance = indexTip.position.distanceTo( thumbTip.position );

			const distanceToPinch = 0.05;
			const threshold = 0.005;

			if ( hand.inputState.pinching && distance > distanceToPinch + threshold ) {

				hand.inputState.pinching = false;
				this.dispatchEvent( {
					type: 'pinchend',
					handedness: inputSource.handedness,
					target: this
				} );

			} else if ( ! hand.inputState.pinching && distance <= distanceToPinch - threshold ) {

				hand.inputState.pinching = true;
				this.dispatchEvent( {
					type: 'pinchstart',
					handedness: inputSource.handedness,
					target: this
				} );

			}

		} else {

			if ( grip !== null && inputSource.gripSpace ) {

				gripPose = frame.getPose( inputSource.gripSpace, referenceSpace );

				if ( gripPose !== null ) {

					grip.matrix.fromArray( gripPose.transform.matrix );
					grip.matrix.decompose( grip.position, grip.rotation, grip.scale );

					if ( gripPose.linearVelocity ) {

						grip.hasLinearVelocity = true;
						grip.linearVelocity.copy( gripPose.linearVelocity );

					} else {

						grip.hasLinearVelocity = false;

					}

					if ( gripPose.angularVelocity ) {

						grip.hasAngularVelocity = true;
						grip.angularVelocity.copy( gripPose.angularVelocity );

					} else {

						grip.hasAngularVelocity = false;

					}

				}

			}

		}

		if ( targetRay !== null ) {

			inputPose = frame.getPose( inputSource.targetRaySpace, referenceSpace );

			// Some runtimes (namely Vive Cosmos with Vive OpenXR Runtime) have only grip space and ray space is equal to it
			if ( inputPose === null && gripPose !== null ) {

				inputPose = gripPose;

			}

			if ( inputPose !== null ) {

				targetRay.matrix.fromArray( inputPose.transform.matrix );
				targetRay.matrix.decompose( targetRay.position, targetRay.rotation, targetRay.scale );

				if ( inputPose.linearVelocity ) {

					targetRay.hasLinearVelocity = true;
					targetRay.linearVelocity.copy( inputPose.linearVelocity );

				} else {

					targetRay.hasLinearVelocity = false;

				}

				if ( inputPose.angularVelocity ) {

					targetRay.hasAngularVelocity = true;
					targetRay.angularVelocity.copy( inputPose.angularVelocity );

				} else {

					targetRay.hasAngularVelocity = false;

				}

				this.dispatchEvent( _moveEvent );

			}

		}


	}

	if ( targetRay !== null ) {

		targetRay.visible = ( inputPose !== null );

	}

	if ( grip !== null ) {

		grip.visible = ( gripPose !== null );

	}

	if ( hand !== null ) {

		hand.visible = ( handPose !== null );

	}

	return this;

}


export { WebXRController, update };

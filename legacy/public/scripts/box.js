Box = function(min, max) {
	THREE.Box3.call(this, min, max);
};

Box.prototype = Object.create(THREE.Box3.prototype);
Box.prototype.constructor = Box;

Box.prototype.setFromObject = function () {

	// Computes the world-axis-aligned bounding box of an object (including its children),
	// accounting for both the object's, and childrens', world transforms

	var v1 = new THREE.Vector3();

	return function ( object, disregardInvisibleObjects ) {

		var scope = this;

		object.updateMatrixWorld( true );

		this.makeEmpty();

		object.traverse( function ( node ) {

			if (disregardInvisibleObjects && !node.visible) {

				return;

			}

			var geometry = node.geometry;

			if ( geometry !== undefined ) {

				if ( geometry instanceof THREE.Geometry ) {

					var vertices = geometry.vertices;

					for ( var i = 0, il = vertices.length; i < il; i ++ ) {

						v1.copy( vertices[ i ] );

						v1.applyMatrix4( node.matrixWorld );

						scope.expandByPoint( v1 );

					}

				} else if ( geometry instanceof THREE.BufferGeometry && geometry.attributes[ 'position' ] !== undefined ) {

					var positions = geometry.attributes[ 'position' ].array;

					for ( var i = 0, il = positions.length; i < il; i += 3 ) {

						v1.set( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

						v1.applyMatrix4( node.matrixWorld );

						scope.expandByPoint( v1 );

					}

				}

			}

		} );

		return this;

	};

}();

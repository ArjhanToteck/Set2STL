"use client";

import LoadingBar from "@/src/components/LoadingBar";

import React, { useState, useEffect } from "react";
import { BP3D } from "binpackingjs";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";

const { Item, Bin, Packer } = BP3D;
const stlLoader = new STLLoader();
const stlExporter = new STLExporter();

export default function Page() {
	// loading bar states
	const [loadPercentage, setLoadPercentage] = useState(0);
	const [loadLabel, setLoadLabel] = useState("Loading...");
	const [loadHidden, setLoadHidden] = useState(true);
	const [downloadEnabled, setDownloadEnabled] = useState(false);
	const [downloadUrl, setDownloadUrl] = useState("");

	// bricks
	let bricks;
	let bricksBin = new Bin("bricks", 220, 250, 220);
	let binPacker = new Packer();

	return (
		<main>
			<section>
				<form onSubmit={loadSet}>
					<h1>Set2STL</h1>

					<p>Enter a Lego set id and download an STL file of its parts.</p>

					<input id="setId" type="text" autoComplete="off" placeholder="Lego Set ID"></input>
					<br></br>
					<br></br>
					<button>Load Set</button>
				</form>
				<br></br>
				<LoadingBar percentage={loadPercentage} label={loadLabel} hidden={loadHidden} />

				<a style={{ display: downloadEnabled ? "block" : "none" }} href={downloadUrl} download={"lego.stl"}>Download</a>
			</section>
		</main>
	);

	function loadSet(event) {
		event.preventDefault();

		setLoadHidden(false);

		// update loading bar
		setLoadLabel("Loading bricks list...");

		const setId = document.getElementById("setId").value;

		fetch(`${process.env.NEXT_PUBLIC_PROCESSING_SERVER}/api/projects/set2Stl?setId=${setId}`)
			.then((response) => response.json())
			.then((data) => {
				bricks = data;
				loadBrickStls();
			});
	}

	async function loadBrickStls() {
		// update loading bar
		for (let i = 0; i < bricks.length; i++) {
			// 10% for the bricks list and all brick stls should make up another 70% total
			const loadPercentage = 0.1 + ((i / bricks.length) * 0.7);

			setLoadPercentage(loadPercentage);
			setLoadLabel(`Loading brick stl ${i + 1}/${bricks.length}...`);

			const brick = bricks[i];

			// load stl
			brick.stl = await loadStlFromName(brick.stlName);

			// load bounding box for stl
			brick.dimensions = await loadDimensionsFromName(brick.stlName);

			// TODO: don't use magic number for padding
			// add padding
			brick.dimensions = [brick.dimensions[0] + 1, brick.dimensions[1] + 1, brick.dimensions[2] + 1];

			// track bin items for this type of brick
			brick.binItems = [];

			// loop once for each brick of this type in the set
			for (let j = 0; j < brick.quantity; j++) {
				// create brick bin packing item (flip y and z for the bin packing coordinate system)
				// TODO: why tf is everything multiplied by 100,000 by the library
				// TODO: in the future, allow rotation and handle it (not allowing it for now)
				const brickBinItem = new Item(`${brick.stlName} (${j + 1})`, brick.dimensions[0], brick.dimensions[2], brick.dimensions[1], 0, [0]);
				binPacker.addItem(brickBinItem);
				brick.binItems.push(brickBinItem);
			}
		}

		packBricks();
	}

	async function loadStlFromName(name) {
		return await stlLoader.loadAsync(`https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/main/stl/${name}.stl`);
	}

	async function loadDimensionsFromName(name) {
		const response = await fetch(`https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/refs/heads/main/dimensions/${name}.json`);

		// check if dimensions exist
		if (!response.ok) {
			return null;
		} else {
			// return dimensions
			return await response.json();
		}
	}

	function packBricks() {
		// update loading bar
		setLoadLabel("Packing bricks...");

		binPacker.addBin(bricksBin);
		binPacker.pack();
		console.log(JSON.parse(JSON.stringify(bricksBin.items)));

		// TODO: handle overflow, creating multiple bins if needed

		combineBricks();
	}

	function combineBricks() {
		setLoadLabel("Combining bricks...");

		const combinedScene = new THREE.Scene();

		// loop through bricks
		for (let i = 0; i < bricks.length; i++) {
			const brick = bricks[i];

			// get adjusted center
			brick.stl.computeBoundingBox();
			const center = new THREE.Vector3();
			brick.stl.boundingBox.getCenter(center);

			// loop for brick quantity
			for (let j = 0; j < brick.quantity; j++) {
				const binItem = brick.binItems[j];

				// create clone
				const stl = brick.stl.clone();

				// get position for brick instance
				let position = binItem.position;

				// flip y and z for three.js
				position = [position[0], position[2], position[1]];

				// fix scale
				position[0] /= 100000;
				position[1] /= 100000;
				position[2] /= 100000;

				// fix stl origin being off
				position[0] -= center.x;
				position[1] -= center.y;
				position[2] -= center.z;

				// fix center pivot
				position[0] += brick.dimensions[0] / 2;
				position[1] += brick.dimensions[1] / 2;
				position[2] += brick.dimensions[2] / 2;

				// set position
				stl.translate(...position);

				// create mesh for brick instance
				const brickMesh = new THREE.Mesh(stl);
				combinedScene.add(brickMesh);
			}
		}

		exportStl(combinedScene);
	}

	function exportStl(combinedScene) {
		setLoadLabel("Exporting scene...");

		// export scene as stl
		const stlBinary = stlExporter.parse(combinedScene, { binary: true });

		// convert to blob url
		const blob = new Blob([stlBinary], { type: "application/octet-stream" });
		const blobUrl = URL.createObjectURL(blob);

		// set download link to blob url
		setDownloadUrl(blobUrl);
		setDownloadEnabled(true);

		setLoadLabel("Done!");
		setLoadPercentage(1);
	}
}
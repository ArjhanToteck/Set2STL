"use client";

import LoadingBar from "@/src/components/LoadingBar";
import { BP3D } from "binpackingjs";

const { Item, Bin, Packer } = BP3D;

import React, { useState, useEffect, useRef } from "react";

export default function Page() {
	let bricks;
	let bricksBin = new Bin("bricks", 220, 250, 220);
	let binPacker = new Packer();

	return (
		<main>
			<section>
				<h1>Bricked Up</h1>

				<p>Enter a Lego set id and download an STL file of its parts.</p>

				<input id="setId" type="text" autoComplete="off" placeholder="Lego Set ID"></input>
				<br></br>
				<button onClick={loadSet}>Load Set</button>
				<br></br>
				{/* TODO: figure out how to update loading bar*/}
				<LoadingBar percentage={50} />

			</section>
		</main>
	);

	function loadSet() {
		const setId = document.getElementById("setId").value;

		fetch(`${process.env.NEXT_PUBLIC_PROCESSING_SERVER}/api/projects/brickedUp?setId=${setId}`)
			.then((response) => response.json())
			.then((data) => {
				bricks = data;
				loadBrickStls();
			});
	}

	async function loadBrickStls() {
		for (let i = 0; i < bricks.length; i++) {
			const brick = bricks[i];

			// load stl
			brick.stl = await loadStlFromName(brick.stlName);

			// load bounding box for stl
			brick.dimensions = await loadDimensionsFromName(brick.stlName);

			// loop once for each brick of this type in the set
			for (let j = 0; j < brick.quantity; j++) {
				// create brick bin packing item
				// TODO: why tf is everything multiplied by 100,000 by the library
				const brickBinItem = new Item("Item " + i, ...brick.dimensions, 0);
				binPacker.addItem(brickBinItem);
			}
		}

		packBricks();
	}

	async function loadStlFromName(name) {
		const response = await fetch(`https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/main/stl/${name}.stl`, { cache: "no-store" });

		// check if stl exists
		if (!response.ok) {
			return null;
		} else {
			// return stl
			return await response.text();
		}
	}

	async function loadDimensionsFromName(name) {
		const response = await fetch(`https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/refs/heads/main/dimensions/${name}.json`, { cache: "no-store" });

		// check if dimensions exist
		if (!response.ok) {
			return null;
		} else {
			// return dimensions
			return await response.json();
		}
	}

	function packBricks() {
		binPacker.addBin(bricksBin);
		binPacker.pack();
		console.log(bricksBin.items);
		// TODO: handle overflow, creating multiple bins
		// TODO: use binpacking info to join everything into a single stl
	}
}
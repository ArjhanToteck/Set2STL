"use client";

import { BP3D } from "binpackingjs";

const { Item, Bin, Packer } = BP3D;

import React, { useState, useEffect, useRef } from "react";

export default function Page() {
	let bricks;
	let bricksBin = new Bin("bricks", 220, 250, 220);
	let binPacker = new Packer();
	binPacker.addBin(bricksBin);

	return (
		<main>
			<section>
				<h1>Bricked Up</h1>

				<p>Enter a Lego set id and download an STL file of its parts.</p>

				<input id="setId" type="text" autoComplete="off" placeholder="Lego Set ID"></input>
				<br></br>
				<button onClick={loadSet}>Load Set</button>

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

		// pack items into bin1
		packer.pack();

		// item1, item2, item3
		console.log(bin1.items);

		for (let i = 0; i < bricks.length; i++) {
			const brick = bricks[i];

			// load stl
			brick.stl = await loadStlFromName(brick.stlName);

			// create brick bin packing item
			// TODO: why tf is everything multiplied by 100,000 by the library
			const brickBinItem = new Item(brick.stlName, 5, 5, 5, 5);
			binPacker.addItem(brickBinItem);
		}

		packBricks();
	}

	async function loadStlFromName(name) {
		const stlRequest = await fetch(`https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/main/stl/${name}.stl`, { cache: "no-store" });

		// check if stl exists
		if (!stlRequest.ok) {
			return null;
		} else {
			// return stl
			return await stlRequest.text();
		}
	}

	function packBricks() {
		binPacker.pack();
		console.log(bricksBin.items);
	}
}
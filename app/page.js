"use client";

import React, { useState, useEffect, useRef } from "react";

export default function Page() {
	let bricks;

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
			});
	}

	async function getStlFromName(name) {
		const stlRequest = await fetch(`https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/main/stl/${name}.stl`, { cache: "no-store" });

		// check if stl exists
		if (!stlRequest.ok) {
			return null;
		} else {
			// return stl
			return await stlRequest.text();
		}
	}
}
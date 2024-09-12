"use client";

import Brick from "./Brick";

const { JSDOM } = require("jsdom");

export default async function Page() {
	getBricksList("75313");

	return (
		<main>
			<section>
				<h1>Bricked Up</h1>


			</section>
		</main>
	);
}

async function getBricksList(setId) {
	// get catalog 
	const catalogResponse = await fetch(`https://www.bricklink.com/v2/catalog/catalogitem.page?S=${setId}`);
	const rawCatalog = await catalogResponse.text();

	// find data-itemid and get the value with regex
	const catalogId = rawCatalog.match(/data-itemid="(\d+)"/)[1];

	// get parts list using catalog id
	const partsResponse = await fetch(`https://www.bricklink.com/v2/catalog/catalogitem_invtab.page?idItem=${catalogId}`);
	const rawParts = await partsResponse.text();

	// parse html
	const partsHtml = new JSDOM(rawParts);

	// get item table rows and convert to array
	const itemRows = [...partsHtml.window.document.getElementsByClassName("pciinvItemRow")];

	let bricks = [];

	itemRows.forEach(element => {
		// get data
		const quantity = parseInt(element.getElementsByTagName("td")[2].textContent, 10);
		const id = element.getElementsByTagName("td")[3].textContent;
		const name = element.getElementsByTagName("td")[4].getElementsByTagName("b")[0].textContent;

		// create brick
		const brick = new Brick(id, quantity, name)

		bricks.push(brick);

		// TODO: get model from https://www.ldraw.org/ (https://library.ldraw.org/library/official/parts/{PART ID}.dat)
	});
}
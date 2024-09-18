import CodeBlock from "@/src/components/CodeBlock";

const { JSDOM } = require("jsdom");

export default async function Page() {
	return (
		<main>
			<section>
				<h1>Bricked Up</h1>

				<CodeBlock code={await getBricksList("75313-1")} />

			</section>
		</main>
	);
}

async function getBricksList(setId) {
	let bricks = [];

	// get bricks list 
	let bricksListRequest = await fetch(`https://rebrickable.com/api/v3/lego/sets/${setId}/parts/?key=${process.env.REBRICKABLE_KEY}`);
	let rawBricksList = await bricksListRequest.json();
	bricks = bricks.concat(rawBricksList.results);
	console.log("finished request");

	// follow all pages in bricks list
	while (rawBricksList.next) {
		bricksListRequest = await fetch(rawBricksList.next);
		rawBricksList = await bricksListRequest.json();
		bricks = bricks.concat(rawBricksList.results);
		console.log("finished request");
	}

	let brickStls = [];

	// loop through bricks
	for (let i = 0; i < bricks.length; i++) {
		// get brick stl and add to list
		const brick = bricks[i];
		const stl = await getBrickStl(brick);
		brickStls.push(stl);
		console.log(i);
	}

	return brickStls[0];
}

async function getBrickStl(brick) {
	let stl = null;


	// try to get stl from ldraw id
	if (!!brick.part.external_ids.LDraw) {
		stl = await getStlFromId(brick.part.external_ids.LDraw[0]);
	}

	// check if stl was found
	if (!stl) {
		// retry with bricklink id
		stl = await getStlFromId(brick.part.external_ids.BrickLink[0]);
	}

	return stl;
}

async function getStlFromId(id) {
	const stlRequest = await fetch(`https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/main/stl/${id}.stl`, { cache: 'no-store' });

	// check if stl exists
	if (!stlRequest.ok) {
		return null;
	} else {
		// return stl
		return await stlRequest.text();
	}
}
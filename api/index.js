import Brick from "./Brick";

const stlLibrary = await getStlLibrary();

export default async function getBricks(req, res) {
	// json header
	res.setHeader("Content-Type", "application/json");

	// get set id from url parameter
	const { searchParams } = new URL(process.env.NEXT_PUBLIC_PROCESSING_SERVER + req.url);
	const setId = searchParams.get("setId");

	let rawBricks = [];

	// get raw bricks list 
	let bricksListRequest = await fetch(`https://rebrickable.com/api/v3/lego/sets/${setId}/parts/?inc_color_details=0&key=${process.env.REBRICKABLE_KEY}`);
	let rawBricksList = await bricksListRequest.json();
	rawBricks = rawBricks.concat(rawBricksList.results);

	// follow all pages in bricks list
	while (rawBricksList.next) {
		bricksListRequest = await fetch(rawBricksList.next);
		rawBricksList = await bricksListRequest.json();
		rawBricks = rawBricks.concat(rawBricksList.results);
	}

	let bricks = [];

	// loop through bricks
	for (let i = 0; i < rawBricks.length; i++) {
		// get brick stl and add to list
		const rawBrick = rawBricks[i];
		const stlName = getBrickStlName(rawBrick);
		let existingMatchFound = false;

		// combine bricks that have the same stl but different color
		for (let j = 0; j < bricks.length; j++) {
			const searchedBrick = bricks[j];

			// check if existing brick stl name matches
			if (searchedBrick.stlName == stlName) {
				// increment preexisting brick count
				searchedBrick.quantity += rawBrick.quantity;

				// mark as having found a preexisting repeat
				existingMatchFound = true;
				break;
			}
		}

		// don't continue if already found a matching brick
		if (existingMatchFound) {
			continue;
		}

		// create new brick and push
		const brick = new Brick(rawBrick.part.part_num, stlName, rawBrick.quantity);
		bricks.push(brick);
	}

	res.status(200).send(JSON.stringify(bricks))
};

async function getStlLibrary() {
	// load parts list in ldraw library github repository
	const request = await fetch("https://raw.githubusercontent.com/ArjhanToteck/LDraw-Library/main/partsList");
	return await request.text();
}

function doesStlExist(name) {
	return stlLibrary.includes(name + "\n");
}

function getBrickStlName(brick) {
	let stlExists = false;
	let ids = [];
	let stlName = null;

	// TODO: only load non-print versions of bricks

	// try to get matching stl from ldraw, then bricklink, then lego
	ids = ids.concat(brick.part.external_ids.LDraw, brick.part.external_ids.BrickLink, brick.part.external_ids.LEGO);

	// loop through ids until finding a match
	for (let i = 0; i < ids.length; i++) {
		// check if match exists
		stlExists = doesStlExist(ids[i]);

		// break if successful
		if (stlExists) {
			stlName = ids[i];
			break;
		}
	}

	return stlName;
}
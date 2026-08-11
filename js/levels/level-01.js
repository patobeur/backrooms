import { defineLevel } from "./level-default.js";

export const level01 = defineLevel({
	id: 1,
	name: "Le seuil jaune",
	maze: {
		width: 17,
		height: 17,
		cellSize: 5,
		roomProfile: "small",
		roomCount: 5,
		roomSize: [2,3],
		corridorBias: .42,
		wallDensity: .9,
		architecture: {columnsChance:0},
	},
	objects: [
		{ id: "plush", progress: 0.02, height: 0.08, lateral: -0.65 },
		{ id: "water_full", progress: 0.035, height: 0.05, lateral: 0.7 },
		{ id: "book_red", progress: 0.16, height: 0.03, lateral: -0.45 },
		{ id: "water_half", progress: 0.28, height: 0.05, lateral: 0.45 },
		{ id: "book_green", progress: 0.4, height: 0.03, lateral: 0.45 },
		{ id: "battery", progress: 0.55, height: 0.06, lateral: 0 },
		{ id: "book_blue", progress: 0.68, height: 0.03, lateral: -0.45 },
		{ id: "book_white", progress: 0.82, height: 0.03, lateral: 0.4 },
	],
	guide: {
		enabled: true,
		leavesArtifact: true,
		activation: "fried-plush-dropped",
	},
	lighting: {
		mode: "uniform",
		spacing: 4,
		intensity: 2.7,
		ambientIntensity: 0.62,
	},
	creatures: [],
	entrance: {
		type: "sealed-wall",
		graffiti: "assets/items/no-exit.png",
	},
	exit: {
		type: "hidden-wall",
		lockedUntilGuide: true,
		opensWhen: "guide-complete",
	},
	transitions: [
		{
			id: "level-01-hidden-exit",
			type: "wall",
			source: { level: 1, anchor: "hidden-exit" },
			target: { level: 2, anchor: "return-wall" },
			reversible: true,
			physicalConnection: false,
			enabledWhen: "guide-complete",
		},
	],
});

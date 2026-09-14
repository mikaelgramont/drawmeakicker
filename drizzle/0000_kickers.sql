CREATE TABLE `kickers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`height` real NOT NULL,
	`width` real NOT NULL,
	`angle` real NOT NULL,
	`repType` text NOT NULL,
	`textured` integer NOT NULL,
	`annotations` integer NOT NULL,
	`grid` integer NOT NULL,
	`mountainboard` integer NOT NULL,
	`rider` integer NOT NULL,
	`fill` integer NOT NULL,
	`borders` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL
);

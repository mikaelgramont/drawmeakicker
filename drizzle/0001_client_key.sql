ALTER TABLE `kickers` ADD `clientKey` text;--> statement-breakpoint
CREATE UNIQUE INDEX `kickers_clientKey_unique` ON `kickers` (`clientKey`);
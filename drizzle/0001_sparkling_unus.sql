CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`restaurantId` text NOT NULL,
	`data` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`createdAt` numeric NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_userId_read_idx` ON `notifications` (`userId`,`read`);--> statement-breakpoint
CREATE TABLE `restaurant_follows` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`restaurantId` text NOT NULL,
	`createdAt` numeric NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `follows_userId_idx` ON `restaurant_follows` (`userId`);--> statement-breakpoint
CREATE INDEX `follows_restaurantId_idx` ON `restaurant_follows` (`restaurantId`);--> statement-breakpoint
CREATE UNIQUE INDEX `follows_user_restaurant_unq` ON `restaurant_follows` (`userId`,`restaurantId`);
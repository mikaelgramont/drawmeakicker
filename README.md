# Draw me a kicker!

## What is this?
This is a personal project I wrote in my spare time to learn how to use Polymer and to have some fun with WebGL while possibly helping out some people out there.
The app's goal is to help build ramps (aka jumps, aka kickers) for mountainboarding, biking, skateboarding and whatnot.

The target audience is the type of people who have experience with launching off of these things, and who want to build a new one. They'll have an idea of how tall they want the jump, and what kind of exit angle they'll want. Some people like flatter, mellow jumps that are good for distance jumps, others will prefer steeper, floaty jumps that are good for tricks.

![](https://raw.githubusercontent.com/mikaelgramont/drawmeakicker/master/public/images/default-kicker.png)

##Install
Install all bower dependencies.

Copy `php/constants.conf.php` to `php/constants.php` and adjust `SITE_URL` to match the deployment site domain and path.

Copy `php/dbsettings.conf.php` to `php/dbsettings.php` and set the MySQL parameters to match the host's.

Run the `bihi_kickers.sql` file through MySQL to create the necessary table (you'll need this for saving and loading kickers, but the rest of the app is all client-side, so you'll be mostly fine without it).

## Building
The client-side app is built on Polymer, which makes heavy use of custom elements, which all live in separate files (prefixed with bihi-). In order to avoid slowing things down on HTTP/1.1 connections, we can use [vulcanizer](https://github.com/polymer/vulcanize) to concatenate them all into one.

On top of those custom elements, there's a ton of separate script files that need to be loaded. There's no module loading logic here, I didn't feel like doing it. So vulcanizer is also used to concatenate them all and send them over to the client in one single file.

Developing locally is done by setting the DEV constant to true in the constants.php file. Setting it to false means the client will load bundled (vulcanized) files.

To update those bundles, run:

`vulcanize scripts-dev.html > scripts.html`

`vulcanize imports-dev.html > imports.html`

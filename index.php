<!-- 
	- add a reset button
	- add a ft/m toggle.
	- add google analytics, and update share urls to have the utm stuff.
	- use a node server to do https/http2
	- mess with console.time to get a sense for how slow things are to load on 3g


	- scenario 1:
		- start a new kicker, go into edit mode
		- set it up
		- download screenshots when desired
		- saving entails:
			- sending data, including current image
			- generating an id
			- persisting data to db
			- returning the following:
				- new url fragment for history update
				- relevant information for open graph (page url, thumbnail url, page title)
	- scenario 2:
		- open page with id, go into view mode

	Before launching:
	- need a logo
	- need some screenshots put together into a video

	Next:
	- add a few more struts when necessary.
	- make the extra length longer if building a quarter pipe.
	- add character.
	- create a better background image for the top section. Possibly add a blueprint in the bottom right corner, so that the action button can be made white against blue.
	- not resetting camera position on update, instead add a button to do that. Another one for VR/fullscreen


	- write a different boundingbox helper for 2d

	Cleanup:
	- dependencies need to be handled better.
	- files need to be bundled.

	Nice to have's
	- add presets for 2d cam positions

	Optimizations:
	- cache text objects as they are super slow to generate
	- use factories and object pools for all object creation, in order to recycle them (replace the geometry, position, scale and rotation).

	Mobile:
	- Add a darkish background color to all containers with background images.
	- switch to em-based font sizes	
-->

<?php
	require("constants.php");
	require("dbsettings.php");
	require("kickerdao.php");
	require("opengraph.php");
	require("share.php");
	
	$kickerData = null;
	$error = false;
	$message = "";
	$ogData = null;
	$initialValues = "''";
	$id = isset($_GET['id']) ? $_GET['id'] : null;
	$title = SITE_TITLE;

	if ($id) {
		try {
			$dbh = KickerDao::getDb();
			$kickerData = KickerDao::loadById($id, $dbh);
		} catch(PDOException $e) {
			$error = true;
			$message = "We are having database issues. Sorry for the inconvenience.";
		} catch(KickerException $e) {
			$error = true;
			$message = $e->getMessage();
		} catch(Exception $e) {
			$error = true;
			$message = "Unknown exception";
			// TODO: log errors to a file.
		}
	}

	if (!$kickerData) {
		$kickerData = KickerDao::getDefaultData();
	}
	$ogData = OpenGraph::getKickerData($kickerData);
	$initialValues = json_encode($kickerData);
	if ($kickerData->title) {
		$title = htmlspecialchars($kickerData->title) . " - " . $title;
	}
	if ($error) {
		$initValues = KickerDao::getDefaultData();
	}
	$autoStart = json_encode($id && !$error);
?>
<html>
	<head>
		<title><?php echo $title?></title>
		<link rel="stylesheet" href="style.css">
		<script src="bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
		<link rel="import" href="elements/bihi-accordion.html">
		<link rel="import" href="elements/bihi-alert.html">
		<link rel="import" href="elements/bihi-context.html">
		<link rel="import" href="elements/bihi-editor.html">
		<link rel="import" href="elements/bihi-design-fieldset.html">
		<link rel="import" href="elements/bihi-design-parameter.html">   
		<link rel="import" href="elements/bihi-design-result.html">
		<link rel="import" href="elements/bihi-design-step.html">
		<link rel="import" href="elements/bihi-export.html">
		<link rel="import" href="elements/bihi-logo.html">
		<link rel="import" href="elements/bihi-params.html">
		<link rel="import" href="elements/bihi-representation.html">
		<link rel="import" href="elements/bihi-renderer3d.html">
		<link rel="import" href="elements/bihi-results.html">
		<link rel="import" href="elements/bihi-save.html">
		<link rel="import" href="elements/bihi-share.html">
		<link rel="import" href="elements/bihi-upload-button.html">
		<?php
			if ($ogData) {
				echo OpenGraph::renderProperties($ogData);
			}
		?>
	</head>

	<body>
		<bihi-alert message="<?php echo $message ?>" id="alert"></bihi-alert>
		<div class="content">
			<header>
				<bihi-logo></bihi-logo>
			</header>

			<div class="top-section-container">
				<section class="top-section">
					<h2 class="top-section-header">
						Design your next ramp.
						No math involved.
					</h2>
					<div class="top-section-body">
						<div class="top-section-content grid-element size-2">
							<p>Thinking of building a new kicker but lacking the math skills to design it precisely? We got you covered.</p>
							<p>The nerds here have done the math for you, so you can focus on the fun part: deciding how big you want to go!</p>
							<button id="start-button" class="action">Get Started</button>
						</div>
						<div class="top-section-content grid-element">
							<div class="video-aspect-ratio-wrapper">
								<?php if (VIDEO_ID) { ?>
								<iframe src="https://www.youtube.com/embed/<?php echo VIDEO_ID; ?>" frameborder="0" allowfullscreen></iframe>
								<?php } ?>
							</div>
						</div>
					</div>
				</section>
			</div>

			<div class="main" role="main">
				<bihi-editor class="editor">
					<bihi-accordion class="renderer-accordion blueprint" role="tablist">
						<bihi-design-step caption="Design" step="0" display-step="1" active first>
							<bihi-design-fieldset legend="Parameters">
								<bihi-params <?php if ($id) echo "disabled"?>></bihi-params>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Results">
								<bihi-results></bihi-results>
							</bihi-design-fieldset>
						</bihi-design-step>

						<bihi-design-step caption="Visualize" step="1" display-step="2">
							<bihi-design-fieldset legend="Representation">
								<bihi-representation></bihi-representation>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Context">
								<bihi-context></bihi-context>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Image export">
								<bihi-export></bihi-export>
							</bihi-design-fieldset>
						</bihi-design-step>

						<bihi-design-step id="save-step" caption="Save" step="2" display-step="3"<?php if($id) { ?> class="hidden"<?php }?>>
							<bihi-design-fieldset legend="Information">
								<bihi-save></bihi-save>
							</bihi-design-fieldset>
						</bihi-design-step>

						<bihi-design-step id="share-step" caption="Share" step="3" display-step="3"<?php if(!$id) { ?> class="hidden"<?php }?>>
							<bihi-design-fieldset legend="Notes">
								<p id="share-title"><?php echo htmlspecialchars($kickerData->title) ?></p>
								<p id="share-description"><?php echo htmlspecialchars($kickerData->description) ?></p>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Share with friends">
								<bihi-share twitter-label="Twitter" facebook-label="Facebook" twitter-url="<?php if ($ogData) echo Share::twitter($ogData["og:url"], $ogData["og:title"], $ogData["og:description"]); ?>" facebook-url="<?php if ($ogData) echo Share::facebook($ogData["og:url"]); ?>">
								</bihi-share>
							</bihi-design-fieldset>
						</bihi-design-step>

					</bihi-accordion>
					<bihi-renderer3d id="renderer" class="blueprint"></bihi-renderer3d>
				</bihi-editor>
			</div>
			<footer>
				<ul>
					<li>Twitter</li>
					<li>Facebook</li>
					<li>Contact</li>
				</ul>
			</footer>
		</div>
		<script>
			var initValues = <?php echo $initialValues ?>;
			var autoStart = <?php echo $autoStart ?>;
		</script>
		<script src="scripts/main.js"></script>
	</body>
</html>
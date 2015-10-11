<!-- 
	Before launching:
  - list scripts in a json file

	- need some screenshots put together into a video
	- add google analytics, and update share urls to have the utm stuff.
	- use a node server to do https/http2
	- mess with console.time to get a sense for how slow things are to load on 3g
	- not resetting camera position on update, instead add a button to do that. Another one for VR/fullscreen

	After launching:
	- responsiveness, no zooming on mobile

	Next:
	- add a few more struts when necessary.
	- make the extra length longer if building a quarter pipe.
	- add character.
	- create a better background image for the top section. Possibly add a blueprint in the bottom right corner, so that the action button can be made white against blue.
	- write a different boundingbox helper for 2d
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
  
  function getBuildFile($file) {
    if (DEV) {
      return $file;
    }
    list($name, $extension) = explode('.', $file);
    return $name.'.min.'.$extension;
  }

	$units = 'm';
	if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
		$isUS = (strpos($_SERVER['HTTP_ACCEPT_LANGUAGE'], 'en-US') === 0);
		$isCA = (strpos($_SERVER['HTTP_ACCEPT_LANGUAGE'], 'en-CA') === 0);
		if ($isUS || $isCA) {
			$units = 'ft';
		}
	}

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
		<link rel="stylesheet" href="style.min.css">
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
        <div role="banner" class="logo size-4">
          <span class="logo-one">Build it.</span>
          <span class="logo-two">Huck it.</span>
        </div>
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
								<bihi-params id="params" units="<?php echo $units; ?>" <?php if ($id) echo "disabled"?>></bihi-params>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Results">
								<bihi-results id="results" units="<?php echo $units; ?>"></bihi-results>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Representation">
								<bihi-representation></bihi-representation>
							</bihi-design-fieldset>
						</bihi-design-step>

						<bihi-design-step caption="Visualize" step="1" display-step="2">
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
							<bihi-design-fieldset legend="Notes" class="share-notes">
								<p id="share-title"><?php echo htmlspecialchars($kickerData->title) ?></p>
								<p id="share-description"><?php echo htmlspecialchars($kickerData->description) ?></p>
							</bihi-design-fieldset>
							<bihi-design-fieldset legend="Share with friends">
								<bihi-share twitter-label="Twitter" facebook-label="Facebook" twitter-url="<?php if ($ogData) echo Share::twitter($ogData["og:url"], $ogData["og:title"], $ogData["og:description"]); ?>" facebook-url="<?php if ($ogData) echo Share::facebook($ogData["og:url"]); ?>">
								</bihi-share>
							</bihi-design-fieldset>
						</bihi-design-step>

					</bihi-accordion>
					<div class="renderer-container">
						<div class="toolbar blueprint">
							<bihi-units units="<?php echo $units; ?>"></bihi-units>
							<bihi-toolbarbuttons id="buttons"></bihi-toolbarbuttons>
						</div>
						<bihi-renderer3d id="renderer" class="blueprint"></bihi-renderer3d>
					</div>
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
			var BIHI = {
        initValues: <?php echo $initialValues ?>,
        autoStart: <?php echo $autoStart ?>,
        units: "<?php echo $units ?>",
        defaultTitle: "<?php echo SITE_TITLE ?>",
        defaultDescription: "<?php echo OG_DESCRIPTION ?>",
        three: '<?php echo getBuildFile('bower_components/threejs/build/three.js')?>',
        files: [
          ['script', 'fonts/archer_medium_regular.typeface.js'],
          <?php if (DEV) { ?>
          ['link', 'scripts.html'],
          <?php } else { ?>
          ['script', 'scripts.min.js'],
          <?php } ?>
          ['link', '<?php echo getBuildFile('imports.html')?>']
        ]
      };
		</script>
		<script src="scripts/main.js"></script>
	</body>
</html>
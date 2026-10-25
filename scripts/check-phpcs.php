<?php
/** Fail new PHPCS findings while recording the recovered source's existing debt. */
$root = dirname( __DIR__ );
chdir( $root );
exec( escapeshellarg( PHP_BINARY ) . ' vendor/bin/phpcs --report=json --no-colors 2>/dev/null', $output, $status );
$report = json_decode( implode( "\n", $output ), true );
if ( ! is_array( $report ) || ! isset( $report['files'] ) || $status > 3 ) {
    fwrite( STDERR, "PHPCS could not produce a valid report. Run composer lint:strict for diagnostics.\n" );
    exit( 1 );
}
$current = array();
foreach ( $report['files'] as $path => $file ) {
    $relative = str_replace( '\\', '/', substr( $path, strlen( $root ) + 1 ) );
    foreach ( $file['messages'] as $message ) {
        // Count exact findings per file without tying the baseline to line numbers.
        $key = $relative . '|' . $message['source'] . '|' . $message['type'] . '|' . $message['message'];
        $current[ $key ] = isset( $current[ $key ] ) ? $current[ $key ] + 1 : 1;
    }
}
ksort( $current );
$baseline_file = $root . '/phpcs-baseline.json';
if ( in_array( '--update', $argv, true ) ) {
    file_put_contents( $baseline_file, json_encode( $current, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) . "\n" );
    echo 'Recorded ' . array_sum( $current ) . " existing findings. Review baseline updates in Git.\n";
    exit( 0 );
}
if ( ! file_exists( $baseline_file ) ) {
    fwrite( STDERR, "PHPCS baseline missing. Review findings before generating one.\n" );
    exit( 1 );
}
$baseline = json_decode( file_get_contents( $baseline_file ), true );
$new = array();
foreach ( $current as $key => $count ) {
    $increase = $count - ( isset( $baseline[ $key ] ) ? $baseline[ $key ] : 0 );
    if ( $increase > 0 ) {
        $new[] = $increase . 'x ' . $key;
    }
}
if ( $new ) {
    fwrite( STDERR, "New coding-standard/compatibility findings:\n" . implode( "\n", $new ) . "\n" );
    exit( 1 );
}
echo 'No new findings; ' . array_sum( $current ) . " existing findings remain. Use composer lint:strict to review them.\n";

<?php
/** Syntax-check project PHP, excluding generated and private files. */
$root = dirname( __DIR__ );
$iterator = new RecursiveIteratorIterator(
    new RecursiveCallbackFilterIterator(
        new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ),
        function ( $file ) {
            return ! $file->isDir() || ! in_array( $file->getFilename(), array( '.git', '.local', '.cache', 'vendor', 'node_modules', 'dist' ), true );
        }
    )
);
$count = 0;
foreach ( $iterator as $file ) {
    if ( 'php' !== $file->getExtension() ) {
        continue;
    }
    exec( escapeshellarg( PHP_BINARY ) . ' -l ' . escapeshellarg( $file->getPathname() ) . ' 2>&1', $output, $status );
    if ( 0 !== $status ) {
        fwrite( STDERR, implode( "\n", $output ) . "\n" );
        exit( 1 );
    }
    $output = array();
    ++$count;
}
echo "PHP syntax passed: {$count} files.\n";

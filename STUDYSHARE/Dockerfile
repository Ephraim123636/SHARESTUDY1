FROM php:8.2-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql

RUN a2enmod rewrite

RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:10000>/' /etc/apache2/sites-available/000-default.conf

RUN echo 'DirectoryIndex index.php index.html' >> /etc/apache2/apache2.conf

ENV PORT=10000

COPY . /var/www/html/

# Allow uploads up to the site's 15 MB limit
RUN printf "upload_max_filesize=16M\npost_max_size=20M\n" > /usr/local/etc/php/conf.d/uploads.ini

# Apache needs permission to save uploaded files
RUN mkdir -p /var/www/html/uploads/profile-images \
    && chown -R www-data:www-data /var/www/html/uploads

EXPOSE 10000

CMD ["apache2-foreground"]

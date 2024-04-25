import React, { useEffect, useState, useMemo } from 'react';
import {
  ChakraProvider,
  Badge,
  Box,
  Center,
  Container,
  Text,
  Input,
  Image,
  InputGroup,
  InputLeftElement,
  LinkBox,
  LinkOverlay,
  Checkbox,
  CheckboxGroup,
  Select,
  Stack,
  Spacer,
  SlideFade,
  Flex,
  Heading,
  theme,
  VStack,
  Avatar,
  Divider,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { Octokit } from '@octokit/core';
import { remark } from 'remark';
import html from 'remark-html';
import debounce from 'lodash.debounce';

import './App.css';

const REPO = 'USERNAME/REPO-NAME';
const octokit = new Octokit({
  auth: 'TOKEN',
});

function App() {
  const [filterOptions, setFilterOptions] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [selectedContent, setSelectedContent] = useState([]);
  const [searchKeywords, setSearchKeywords] = useState('');
  const [sortedBy, setSortedBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');

  const onCheckFilter = (category, value) => {
    console.log('onCheckFilter category: ', category, ' value: ', value);
    let updatedFilters = {};
    if (value.length > 0) {
      updatedFilters = {
        ...selectedFilters,
        [`${category}`]: [value],
      };
      console.log('updatedFilters: ', updatedFilters);
    } else {
      console.log(
        `Deleting category ${category} from filters since it's empty`
      );
      updatedFilters = {
        ...selectedFilters,
      };
      delete updatedFilters[category];
    }
    setSelectedFilters(updatedFilters);
  };

  useEffect(async () => {
    const labels = await octokit.request('GET /repos/{owner}/{repo}/labels', {
      owner: 'Ray285',
      repo: 'react-gh-pages-test',
    });
    console.log('labels: ', labels);
    const categories = {};
    labels.data.map(label => {
      // Break up the labels into the tag category and tag value "Study Type: User Interview" -> ["Study Type", "User Interview"]
      let labelParts = label.name.split(': ');
      // If the label doesn't follow the naming convention then return without adding it to the filter options
      if (labelParts.length <= 1) {
        return;
      }
      // If the array of tag values already exists for the current key (labelParts[0]) then push this value into that array
      /*
        EXAMPLE 
        { 
          'categoryName1': ['tagValue1', 'tagValue2', 'tagValue3'], 
          'categoryName2': ['tagValue1', 'tagValue2', 'tagValue3'] 
        }
      */
      if (categories[labelParts[0]] && categories[labelParts[0]].length > 0) {
        categories[labelParts[0]].push(labelParts[1]);
      } else {
        // There's no key yet for the category so make a new one and add the tag value to the array at that location
        categories[labelParts[0]] = [labelParts[1]];
      }
    });
    console.log('FINAL categories: ', categories);
    setFilterOptions(categories);
  }, []);

  useEffect(async () => {
    console.log('selectedFilters: ', selectedFilters);
    const labelQueryParam = Object.keys(selectedFilters)
      .map(filter => {
        console.log('filter: ', selectedFilters[filter]);
        const labels = selectedFilters[filter].join(',').replace(',', '","');
        console.log('labels: ', `"${labels}"`);
        return `label:"${labels}"`;
      })
      .join(' ');
    console.log('labelQueryParam: ', labelQueryParam);
    const issues = await octokit.request('GET /search/issues', {
      q: `${searchKeywords} repo:${REPO} ${labelQueryParam} sort:${sortedBy}`,
    });
    console.log('issues: ', issues);
    setIssues(issues.data);
  }, [selectedFilters, searchKeywords, sortedBy]);

  const handleShowContent = async content => {
    // Use remark to convert markdown into HTML string
    const processedContent = await remark().use(html).process(content);
    const contentHtml = processedContent.toString();
    console.log('contentHtml: ', contentHtml);
    setSelectedContent(contentHtml);
  };

  const searchKeywordsChangeHandler = event => {
    setSearchKeywords(event.target.value);
  };

  const debouncedChangeHandler = useMemo(() => {
    return debounce(searchKeywordsChangeHandler, 300);
  }, []);

  const issueListItems =
    issues.items &&
    issues.items.map((issue, idx) => (
      <SlideFade in={true} offsetY="20px" delay={idx * 0.05}>
        <LinkBox
          key={issue.id}
          as="article"
          maxW="sm"
          p="5"
          _hover={{
            borderColor: '#3081cd',
          }}
          _light={{
            bg: issue.id === selectedIssue?.id ? '#deefff' : '#fff',
            borderColor: issue.id === selectedIssue?.id ? '#3081cd' : null,
          }}
          _dark={{
            bg: issue.id === selectedIssue?.id ? '#00518c' : '#1d273a',
            borderColor: issue.id === selectedIssue?.id ? '#3081cd' : null,
          }}
          borderWidth="1px"
          rounded="md"
          borderWidth={2}
          onClick={e => {
            e.preventDefault();
            setSelectedIssue(issue);
            handleShowContent(issue.body);
          }}
        >
          <Flex alignItems="center">
            <Avatar
              name={issue.user.login}
              src={issue.user.avatar_url}
              w="32px"
              h="32px"
              mr="8px"
            />
            <Box>
              <Text color="teal.400" href="#" fontWeight="bold">
                {issue.user.login}
              </Text>
              <Text fontSize="xs">
                Created:{' '}
                {new Date(issue.created_at).toLocaleDateString('en-us', {
                  // weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text fontSize="xs">
                Last Updated:{' '}
                {new Date(issue.updated_at).toLocaleDateString('en-us', {
                  // weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </Box>
          </Flex>
          <Heading size="md" my="2">
            <LinkOverlay href="#">{issue.title}</LinkOverlay>
          </Heading>
          <Badge variant="subtle" colorScheme="green">
            {issue.labels[0].name}
          </Badge>
          <Badge variant="subtle" colorScheme="green">
            {issue.labels[1].name}
          </Badge>
          {issue.labels.length > 2 ? (
            <Badge>+{issue.labels.length - 2} other tags</Badge>
          ) : null}
        </LinkBox>
      </SlideFade>
    ));

  return (
    <ChakraProvider theme={theme}>
      <Box _light={{ bg: 'whitesmoke' }}>
        <Container h={'100vh'} maxW="90rem" pt={'10vh'}>
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            align={'center'}
            zIndex={3}
            w={'100%'}
            height={'10vh'}
            maxW={'container.xl'}
            margin="auto"
          >
            <Spacer />
            <InputGroup w={'400px'}>
              <InputLeftElement
                pointerEvents="none"
                children={<SearchIcon color="gray.300" />}
              />
              <Input
                type="text"
                _light={{ bg: '#fff' }}
                placeholder="Search Keywords"
                onChange={debouncedChangeHandler}
              />
            </InputGroup>
            <InputGroup flex={1} alignItems={'center'}>
              <Text ml={8} mr={2}>
                Sort by
              </Text>
              <Select
                _light={{ bg: '#fff' }}
                flex={1}
                maxW="200px"
                defaultValue={'created'}
                onChange={e => {
                  setSortedBy(e.target.value);
                  setSortOrder(e.target.value === 'created' ? 'asc' : 'desc');
                }}
              >
                <option value="created">Created</option>
                <option value="updated">Last Updated</option>
                <option value="comments">Most Comments</option>
              </Select>
            </InputGroup>
            <ColorModeSwitcher justifySelf="flex-end" />
          </Flex>
          <Flex flex={1}>
            <Box>
              <Heading size={'md'} mb="4" h="1vh">
                Filters
              </Heading>
              <Divider h="1vh" />
              <Flex
                direction={'column'}
                scrollBehavior={'smooth'}
                px={2}
                py={4}
                h="87vh"
                overflowY="scroll"
                minW="200px"
                flex={0.5}
              >
                {filterOptions &&
                  Object.keys(filterOptions).map((category, cIdx) => {
                    return (
                      <Box key={cIdx}>
                        <CheckboxGroup
                          colorScheme="blue"
                          onChange={value => onCheckFilter(category, value)}
                        >
                          <Text
                            color="gray.500"
                            fontWeight="semibold"
                            letterSpacing="wide"
                            fontSize="xs"
                            textTransform="uppercase"
                            mt={cIdx > 0 ? 8 : 0}
                            mb="4"
                          >
                            {category}
                          </Text>
                          <Stack direction={['column']}>
                            {filterOptions[category].map((value, idx) => (
                              <Checkbox
                                key={`${cIdx}-${idx}`}
                                value={`${category}: ${value}`}
                              >
                                {value}
                              </Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      </Box>
                    );
                  })}
              </Flex>
            </Box>
            <Center mx={2}>
              <Divider orientation="vertical" />
            </Center>
            <Box>
              <Heading size={'md'} mb="4" h="1vh">
                Results
              </Heading>
              <Divider h="1vh" />
              <VStack
                height="87vh"
                scrollBehavior={'smooth'}
                overflowY="scroll"
                minW="280px"
                w="280px"
                spacing="16px"
                direction="column"
                py={4}
                px={2}
                flex={0.5}
              >
                {issueListItems?.length > 0 ? (
                  issueListItems
                ) : (
                  <Flex
                    direction="column"
                    // justify="center"
                    alignItems="center"
                    h="100%"
                  >
                    <Image src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png" />
                    <Text>
                      No results found for the current search criteria
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>
            <Center mx={2}>
              <Divider orientation="vertical" />
            </Center>
            <Box w="100%">
              <Heading size={'md'} mb="4" h="1vh">
                Content
                {selectedIssue?.title?.length > 0
                  ? `: ${selectedIssue?.title}`
                  : ''}
              </Heading>
              <Divider h="1vh" />
              <Flex
                height="87vh"
                scrollBehavior={'smooth'}
                overflowY="scroll"
                flex={3}
                direction="column"
                px="4"
                _light={{
                  bg: '#fff',
                }}
                _dark={{
                  bg: '#1d273a',
                }}
              >
                {selectedContent?.length > 0 ? (
                  <SlideFade in={true}>
                    <Box
                      className="content-container"
                      py={4}
                      dangerouslySetInnerHTML={{ __html: selectedContent }}
                    />
                  </SlideFade>
                ) : (
                  <Flex
                    direction="column"
                    justify="center"
                    alignItems="center"
                    h="100%"
                  >
                    <Image src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png" />
                    <Text>Select a result to view its content</Text>
                  </Flex>
                )}
              </Flex>
            </Box>
          </Flex>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
